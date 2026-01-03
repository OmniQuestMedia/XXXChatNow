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
        message.error('Please connetct toy to Lovense Extension');
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

      // Check if this model is a target for MODEL_TOY dispatch
      const modelTarget = envelope.routing.targets.find(
        (target) => target.type === 'MODEL_TOY' && target.modelId === envelope.model.modelId
      );

      if (!modelTarget) {
        console.log('[Lovense] No MODEL_TOY target for this model', { tipId: envelope.tipId });
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

        // Check if toys are connected
        const toys = (await camExtension.current.getToyStatus()) as ToyJson[];
        if (!toys || toys.length === 0) {
          console.error('[Lovense] No toys connected', { tipId: envelope.tipId });
          return;
        }

        // Dispatch vibration via Cam Extension using receiveTip
        // The receiveTip method expects token amount and sender name
        // For now, we use this existing integration path
        camExtension.current.receiveTip(
          envelope.transaction.amount,
          envelope.tipper.username
        );

        console.log('[Lovense] Vibration dispatched via EXTENSION', {
          tipId: envelope.tipId,
          vibrationType: vibration.type,
          strength: vibration.strength,
          durationSec: vibration.durationSec
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
