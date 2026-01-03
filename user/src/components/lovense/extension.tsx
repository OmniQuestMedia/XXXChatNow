import { sendStreamMessage } from '@redux/stream-chat/actions';
import { settingService } from '@services/setting.service';
import { message } from 'antd';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToyJson, LovenseActivateEnvelope } from 'src/interfaces';
import { SocketContext } from 'src/socket';

const EVENT = {
  TIPPED: 'tipped',
  LOVENSE_ACTIVATE: 'lovense.activate'
};

// Maximum number of tipIds to keep in memory for idempotency
// After this limit, oldest entries will be removed (FIFO)
const MAX_PROCESSED_TIP_IDS = 1000;

interface LovenseExtensionProps {
  model: string;
  children: any;
}

export const LovenseContext = createContext(null);

export default function LovenseExtension({
  children,
  model
}: LovenseExtensionProps) {
  const dispatch = useDispatch();
  const { getSocket } = useContext(SocketContext);
  const toyJsons = useRef<ToyJson[]>([]);
  const camExtension = useRef<any>(null);
  const processedTipIds = useRef<Set<string>>(new Set());

  const performer = useSelector(
    (state: any) => state.performer.current
  );
  const activeConversation = useSelector(
    (state: any) => state.streamMessage.activeConversation
  );
  const activeConversationRef = useRef<any>();

  const [connected, setConnected] = useState(false);

  const handleTip = async ({ senderInfo, token }) => {
    if (camExtension.current) {
      const toys = (await camExtension.current.getToyStatus()) as ToyJson[];
      if (toys.length) {
        camExtension.current.receiveTip(token, senderInfo?.username || '');
      } else {
        message.error('Please connect toy to Lovense Extension');
      }
    }
  };

  const handleLovenseActivate = async (envelope: LovenseActivateEnvelope) => {
    try {
      // Enforce idempotency - ignore duplicate tipIds
      if (processedTipIds.current.has(envelope.tipId)) {
        console.log('[Lovense] Duplicate tipId ignored (idempotency)', { tipId: envelope.tipId });
        return;
      }

      // Mark tipId as processed
      processedTipIds.current.add(envelope.tipId);

      // Prevent unbounded memory growth - keep only the most recent tipIds
      if (processedTipIds.current.size > MAX_PROCESSED_TIP_IDS) {
        // Convert to array, remove oldest (first) entry, recreate Set
        const entries = Array.from(processedTipIds.current);
        entries.shift(); // Remove oldest
        processedTipIds.current = new Set(entries);
      }

      // Check if this model is a target for MODEL_TOY dispatch
      // Compare against the current performer's _id
      const currentModelId = performer?._id;
      if (!currentModelId) {
        console.error('[Lovense] Current performer ID not available', { tipId: envelope.tipId });
        return;
      }

      const modelTarget = envelope.routing.targets.find(
        (target) => target.type === 'MODEL_TOY' && target.modelId === currentModelId
      );

      if (!modelTarget) {
        console.log('[Lovense] No MODEL_TOY target for this model', { 
          tipId: envelope.tipId,
          currentModelId
        });
        return;
      }

      // Check if vibration spec exists
      if (!envelope.item.vibration) {
        console.log('[Lovense] No vibration spec in envelope', { tipId: envelope.tipId });
        return;
      }

      const { vibration } = envelope.item;
      const { lovenseMode } = envelope.model;

      // Dispatch based on lovenseMode
      if (lovenseMode === 'EXTENSION') {
        if (!camExtension.current) {
          console.error('[Lovense] Cam Extension not initialized', { tipId: envelope.tipId });
          return;
        }

        // Check if toys are connected (wrapped in try-catch for safety)
        let toys: ToyJson[];
        try {
          toys = (await camExtension.current.getToyStatus()) as ToyJson[];
        } catch (toyStatusError) {
          console.error('[Lovense] Failed to get toy status', { 
            tipId: envelope.tipId,
            error: toyStatusError instanceof Error ? toyStatusError.message : 'Unknown error'
          });
          return;
        }

        if (!toys || toys.length === 0) {
          console.error('[Lovense] No toys connected', { tipId: envelope.tipId });
          return;
        }

        // PR7: Map canonical vibration spec to bounded synthetic tip amount
        // and dispatch via CamExtension.receiveTip(amount, 'Lovense', cParameter)
        
        // Mapping constants - ship-hack formula parameters
        // These values are temporary and will be replaced when command-level vibration API is available
        const MAPPING_BASE = 5;
        const MAPPING_STRENGTH_MULTIPLIER = 10;
        const MAPPING_DURATION_MULTIPLIER = 2;
        const DEFAULT_STRENGTH = 10;  // Default strength for PRESET/LEVEL when missing
        const DEFAULT_DURATION_SEC = 5;  // Default duration for PRESET/LEVEL when missing
        const MIN_STRENGTH = 0;
        const MAX_STRENGTH = 20;
        const MIN_DURATION = 0;
        const MAX_DURATION = 30;
        const MIN_AMOUNT = 1;
        const MAX_AMOUNT = 500;
        
        // Handle PATTERN type - not supported, warn and no-op
        if (vibration.type === 'PATTERN') {
          console.warn('[Lovense] PATTERN vibration type not supported (no-op)', { 
            tipId: envelope.tipId 
          });
          return;
        }

        // Extract strength and durationSec with defaults
        // Both PRESET and LEVEL use the same defaults when values are missing
        let strength: number;
        let durationSec: number;

        if (vibration.type === 'PRESET' || vibration.type === 'LEVEL') {
          strength = vibration.strength ?? DEFAULT_STRENGTH;
          durationSec = vibration.durationSec ?? DEFAULT_DURATION_SEC;
        } else {
          console.error('[Lovense] Unknown vibration type', { 
            tipId: envelope.tipId, 
            vibrationType: vibration.type 
          });
          return;
        }

        // Clamp strength to [MIN_STRENGTH..MAX_STRENGTH]
        const clampedStrength = Math.max(MIN_STRENGTH, Math.min(MAX_STRENGTH, strength));
        
        // Clamp durationSec to [MIN_DURATION..MAX_DURATION]
        const clampedDuration = Math.max(MIN_DURATION, Math.min(MAX_DURATION, durationSec));

        // Calculate synthetic tip amount using ship-hack formula
        // Formula: amount = round(base + strength*strengthMultiplier + durationSec*durationMultiplier)
        const rawAmount = MAPPING_BASE + (clampedStrength * MAPPING_STRENGTH_MULTIPLIER) + (clampedDuration * MAPPING_DURATION_MULTIPLIER);
        const roundedAmount = Math.round(rawAmount);
        
        // Clamp final amount to [MIN_AMOUNT..MAX_AMOUNT]
        const syntheticTipAmount = Math.max(MIN_AMOUNT, Math.min(MAX_AMOUNT, roundedAmount));

        // Prepare traceability parameter (cParameter)
        const cParameter = {
          tipId: envelope.tipId,
          sourceRef: envelope.ledger.sourceRef,
          vibration: {
            type: vibration.type,
            strength: clampedStrength,
            durationSec: clampedDuration
          },
          mode: lovenseMode
        };

        // Dispatch via receiveTip with synthetic amount, 'Lovense' as username (no PII), and cParameter
        camExtension.current.receiveTip(
          syntheticTipAmount,
          'Lovense',
          cParameter
        );

        console.log('[Lovense] Vibration dispatched via EXTENSION (ship-hack mapping)', {
          tipId: envelope.tipId,
          vibrationType: vibration.type,
          originalStrength: strength,
          originalDuration: durationSec,
          clampedStrength,
          clampedDuration,
          syntheticTipAmount,
          cParameter
        });
      } else if (lovenseMode === 'CAM_KIT') {
        console.log('[Lovense] CAM_KIT not implemented', { tipId: envelope.tipId });
      } else {
        console.error('[Lovense] Unknown lovenseMode', { 
          tipId: envelope.tipId, 
          lovenseMode 
        });
      }
    } catch (error) {
      console.error('[Lovense] Failed to dispatch vibration', { 
        tipId: envelope.tipId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const receiveMessage = (userName: string, content: string) => {
    if (camExtension.current) {
      /*
       * receiveMessage
       * @param {string} userName  the sender’s Screen Name
       * @param {string} content the message just sent by the sender
       */
      camExtension.current.receiveMessage(userName, content);
    }
  };

  const postMessage = (text: string) => {
    if (!activeConversationRef.current) return;

    dispatch(
      sendStreamMessage({
        conversationId: activeConversationRef.current.data._id,
        data: {
          text
        },
        type: activeConversationRef.current.data.type
      })
    );
  };

  const onMessage = (msg: any) => {
    if (!activeConversationRef.current) return;
    if (msg.conversationId !== activeConversationRef.current.data._id) return;

    receiveMessage(msg.senderInfo.username, msg.text);
  };

  const initSocketEvent = async () => {
    try {
      setConnected(true);
      camExtension.current = (window as any).camExtension;
      // Handle the CamExtension instance object
      const socket = getSocket();
      if (socket.connected) {
        socket && socket.on(EVENT.TIPPED, handleTip);
        socket && socket.on(EVENT.LOVENSE_ACTIVATE, handleLovenseActivate);
        // stream_message_created_conversation
        socket && socket.on('stream_message_created_conversation', onMessage);
      } else {
        socket?.once('connect', () => {
          socket && socket.on(EVENT.TIPPED, handleTip);
          socket && socket.on(EVENT.LOVENSE_ACTIVATE, handleLovenseActivate);
          socket && socket.on('stream_message_created_conversation', onMessage);
        });
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error);
    }
  };

  const initialize = async () => {
    try {
      if (!model) return;

      const resp = await settingService.valueByKeys(['enableLovense', 'lovenseCamSiteName']);
      const { lovenseCamSiteName, enableLovense } = resp.data;
      if (!enableLovense || !lovenseCamSiteName) return;

      if ((window as any).CamExtension) {
        (window as any).camExtension = new (window as any).CamExtension(
          lovenseCamSiteName,
          model
        );
        const readyCallback = () => {
          initSocketEvent();
        };

        (window as any).camExtension.on('toyStatusChange', (data) => {
          // Handle toy information data
          // data = [{
          //  id: "d6c35fe83348",
          //  name: "toy's name",
          //  type: "lush",
          //  status: "on",
          //  version: "",
          //  battery: "80"
          // }]
          toyJsons.current = data;
        });

        (window as any).camExtension.on('ready', readyCallback);

        (window as any).camExtension.on('postMessage', postMessage);
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error);
    }
  };

  useEffect(() => {
    initialize();

    return () => {
      const socket = getSocket();
      socket && socket.off(EVENT.TIPPED, handleTip);
      socket && socket.off(EVENT.LOVENSE_ACTIVATE, handleLovenseActivate);
    };
  }, []);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const getToys = () => toyJsons.current;

  const getCamExtension = () => camExtension.current;

  const value = useMemo(
    () => ({
      connected,
      getToys,
      getCamExtension,
      receiveMessage
    }),
    [connected, getToys, getCamExtension, receiveMessage]
  );

  return (
    <LovenseContext.Provider value={value}>{children}</LovenseContext.Provider>
  );
}

export const useCamExtension = () => {
  const state = useContext(LovenseContext);
  return state;
};
