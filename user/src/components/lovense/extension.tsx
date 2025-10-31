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
import { ToyJson } from 'src/interfaces';
import { SocketContext } from 'src/socket';

const EVENT = {
  TIPPED: 'tipped'
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
        // stream_message_created_conversation
        socket && socket.on('stream_message_created_conversation', onMessage);
      } else {
        socket?.once('connect', () => {
          socket && socket.on(EVENT.TIPPED, handleTip);
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
