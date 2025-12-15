import { getResponseError, redirect } from '@lib/utils';
import {
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateActivePerformer } from '@redux/streaming/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Col, List,
  message, Row
} from 'antd';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import nextCookie from 'next-cookies';
import {
  forwardRef,
  useCallback,
  useContext, useEffect, useRef, useState
} from 'react';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import {
  IPerformer
} from 'src/interfaces';
import {
  performerService, settingService, streamService, transactionService
} from 'src/services';
import { SocketContext } from 'src/socket';

import style from './style.module.less';

const ListItem = dynamic(() => import('@components/common/base/list-item'), { ssr: false });
const ChatBox = dynamic(() => import('@components/stream-chat/chat-box'), { ssr: false });
const Header = dynamic(() => import('@components/streaming/header'), { ssr: false });
const PrivateStreaming = dynamic(() => import('@components/streaming/private-streaming-container'), { ssr: false });

const ForwardRefPrivateStreaming = forwardRef<any, any>((props, ref) => <PrivateStreaming {...props} innerRef={ref} />);

// eslint-disable-next-line no-shadow
enum EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  MODEL_JOIN_ROOM = 'MODEL_JOIN_ROOM',
  SEND_PAID_TOKEN = 'SEND_PAID_TOKEN'
}

const mapStateToProps = (state) => ({
  user: state.user.current,
  singularTextModel: state.ui.singularTextModel,
  activeConversation: state.streamMessage.activeConversation
});
const mapDispatches = {
  dispatchGetStreamConversationSuccess: getStreamConversationSuccess,
  dispatchResetStreamMessage: resetStreamMessage,
  dispatchUpdateBalance: updateCurrentUserBalance,
  dispatchResetStreamConversation: resetStreamConversation
};

const connector = connect(mapStateToProps, mapDispatches);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = {
  performer: IPerformer;
  // autoRequest?: boolean;
};

function UserPrivateChat({
  // autoRequest = false,
  performer,
  user,
  singularTextModel = 'Performer',
  activeConversation,
  dispatchUpdateBalance,
  dispatchGetStreamConversationSuccess,
  dispatchResetStreamConversation,
  dispatchResetStreamMessage
}: Props & PropsFromRedux) {
  const dispatch = useDispatch();
  const streamRef = useRef(null);
  const activeConversationRef = useRef(activeConversation);
  const interval = useRef(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const [modelJoined, setModelJoined] = useState(false);
  const [participant, setParticipant] = useState({
    total: 0,
    members: []
  });
  const [callTime, setCallTime] = useState(0);
  const [paidToken, setPaidToken] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const [settings, setSetting] = useState(null);
  const router = useRouter();

  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'defaultPrivateCallImage'
    ]);
    setSetting(metaSettings.data);
  };

  const dataSource = [
    {
      // title: 'Status: ',
      description: roomJoined ? 'Live' : ''
    },
    {
      // title: 'Call time: ',
      description: `${callTime} minute(s)`
    },
    {
      title: 'Paid: ',
      description: `${paidToken} token(s)`
    },
    {
      title: 'Per minute: ',
      description: `${performer.privateCallPrice} token(s)` || 'N/A'
    }
  ];

  const handlerInfoChange = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setParticipant({
        total,
        members
      });
    }
  };

  const roomJoinedHandler = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setRoomJoined(true);
      setCallTime(0);
      setParticipant({
        total,
        members
      });
    }
  };

  const stopBroadcast = () => {
    message.info('Streaming stopped. Redirect to homepage in 3 seconds');
    streamRef.current?.stop();

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const sendPaidToken = async (conversationId: string) => {
    try {
      await transactionService.sendPaidToken(conversationId);
      setPaidToken((prevState) => prevState + performer.privateCallPrice);
      dispatchUpdateBalance((performer.privateCallPrice * (-1)));
    } catch (err) {
      const error = await Promise.resolve(err);
      if (error.statusCode === 400) {
        message.error('Your tokens do not enough, please buy more.');
      }
      interval.current && clearInterval(interval.current);
      // something else, stop and redirect to others
      stopBroadcast();
    }
  };

  const handleModelJoinRoom = ({ conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      message.success(`${singularTextModel} joined the room!`);
      setModelJoined(true);
      if (user.balance < performer.privateCallPrice) {
        message.warn('Your balance is not enough token. Redirect to homepage in 3 seconds');
        setTimeout(() => {
          window.location.href = '/';
        }, 3 * 1000);
      } else {
        sendPaidToken(conversationId);
        interval.current = setInterval(() => {
          setCallTime((prevState) => prevState + 1);
          sendPaidToken(conversationId);
        }, 60 * 1000);
      }
    }
  };

  const leaveSession = () => {
    dispatchResetStreamMessage();

    if (activeConversationRef.current?.data) {
      const socket = getSocket();
      socket && socket.off(EVENT.STREAM_INFORMATION_CHANGED, handlerInfoChange);
      socket && socket.off(EVENT.JOINED_THE_ROOM, roomJoinedHandler);
      socket && socket.off(EVENT.MODEL_JOIN_ROOM, handleModelJoinRoom);
      socket.emit(EVENT.LEAVE_ROOM, {
        conversationId: activeConversationRef.current.data._id
      });
    }

    if (interval.current) {
      clearInterval(interval.current);
    }

    dispatchResetStreamConversation();
    setRoomJoined(false);
    setParticipant({
      total: 0,
      members: []
    });
  };

  const sendRequest = async () => {
    if (user.balance < performer.privateCallPrice) {
      message.error('Oops, you don’t have enough tokens');
      return;
    }

    try {
      setRequesting(true);
      const resp = await streamService.requestPrivateChat(performer._id);
      const { sessionId, conversation } = resp.data;
      dispatchGetStreamConversationSuccess({
        data: conversation
      });

      message.success('Private request has been sent!');

      streamRef.current.start(sessionId, conversation._id);

      const socket = getSocket();
      socket.emit(EVENT.JOIN_ROOM, {
        conversationId: conversation._id
      });
      setRequesting(false);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
      setRequesting(false);
    }
  };

  const onStreamRefChange = useCallback((node) => {
    streamRef.current = node;
    // auto start stream
    // if (node) {
    //   // DOM node referenced by ref has changed and exists
    //   sendRequest();
    // }
  }, []);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
    dispatch(updateActivePerformer(performer));
  }, [activeConversation]);

  useEffect(() => {
    getSettingKeys();
  }, []);

  const initSocketEvent = () => {
    const socket = getSocket();
    socket && socket.on(EVENT.STREAM_INFORMATION_CHANGED, handlerInfoChange);
    socket && socket.on(EVENT.JOINED_THE_ROOM, roomJoinedHandler);
    socket && socket.on(EVENT.MODEL_JOIN_ROOM, handleModelJoinRoom);
  };

  useEffect(() => {
    if (connected()) initSocketEvent();
  }, [socketStatus]);

  const onbeforeunload = () => {
    leaveSession();
  };

  useEffect(() => {
    window.addEventListener('beforeunload', onbeforeunload);
    router.events.on('routeChangeStart', onbeforeunload);

    return () => {
      window.removeEventListener('beforeunload', onbeforeunload);
      router.events.off('routeChangeStart', onbeforeunload);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Private Chat</title>
      </Head>
      <>
        <Header performer={performer} />
        <Row>
          <Col lg={12} md={12} xs={24}>

            {performer.isOnline && !roomJoined
              && (
              <div className={style['txt-show-chat']}>
                <div
                  className="bg-full-stream"
                  style={{
                    backgroundImage: `url(${settings?.defaultPrivateCallImage})`
                  }}
                />
                <div>
                  <img src={performer.avatar} alt={performer.username} />
                  <p>Private streaming</p>
                  Per minute:
                  {performer.privateCallPrice || 'NA'}
                  {' '}
                  token(s)
                </div>
              </div>
              )}
            {performer.isOnline && roomJoined
              && (
              <>
                <List
                  dataSource={dataSource}
                  className={style['list-item-private']}
                  renderItem={(item) => (
                    <ListItem
                      description={item.description}
                      title={item.title}
                    />
                  )}
                />
                {!modelJoined && (
                <div className={style['load-model-request']}>
                  <div style={{ marginTop: '50px' }}>
                    <img src={performer.avatar} alt={performer.username} />
                    <p>
                      Request private streaming
                      {' '}
                      <div className="loader">
                        <span />
                        <span />
                        <span />
                      </div>
                    </p>
                  </div>
                </div>
                )}

              </>
              )}
            {!performer.isOnline && (
            <div className={style['txt-show-chat']}>
              <div
                className="bg-full-stream"
                style={{
                  backgroundImage: `url(${settings?.defaultPrivateCallImage})`
                }}
              />
              <div>
                <img src={performer.avatar} alt={performer.username} />
                <p>
                  {performer.username}
                  {' '}
                  is Offline
                </p>
              </div>
            </div>
            )}
            <ForwardRefPrivateStreaming
              ref={onStreamRefChange}
              configs={{
                localVideoId: 'private-publisher'
              }}
              onClick={sendRequest}
              requesting={requesting}
              performer={performer}
              requestFromUser
            />
            {/* <Footer performer={performer} settings={streamSettings} inPrivateChat /> */}

          </Col>
          <Col lg={12} xs={24} md={12}>
            <ChatBox
              activeConversation={activeConversation}
              currentPerformer={performer}
              totalParticipant={participant.total}
              members={participant.members}
            />
          </Col>
        </Row>
      </>
    </>
  );
}

UserPrivateChat.authenticate = true;
UserPrivateChat.layout = 'stream';

UserPrivateChat.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    if (typeof window !== 'undefined' && query.performer) {
      return {
        performer: JSON.parse(query.performer)
      };
    }

    const { token } = nextCookie(ctx);
    const headers = { Authorization: token };
    const resp = await performerService.details(query.username, headers);
    const performer = resp.data;
    if (performer.isBlocked) {
      redirect('/403', ctx);
      return {};
    }

    return {
      performer
    };
  } catch (e) {
    redirect('/', ctx);
    return {};
  }
};

export default connector(UserPrivateChat);
