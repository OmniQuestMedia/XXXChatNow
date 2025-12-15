// import './index.less';
import ListItem from '@components/common/base/list-item';
import ChatBox from '@components/stream-chat/chat-box';
// import Footer from '@components/streaming/footer';
import GroupChatContainer from '@components/streaming/group-streaming-container';
import Header from '@components/streaming/header';
import { getStreamBackground } from '@lib/styles';
import { getResponseError, redirect } from '@lib/utils';
import {
  getStreamConversation,
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Col, List,
  message, Row
} from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/router';
import nextCookie from 'next-cookies';
import {
  useContext, useEffect, useRef, useState
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  IPerformer
} from 'src/interfaces';
import {
  performerService,
  settingService,
  streamService,
  transactionService
} from 'src/services';
import { SocketContext } from 'src/socket';

import style from '../index.module.less';

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  SEND_PAID_TOKEN = 'SEND_PAID_TOKEN'
}

const MODEL_LEFT_ROOM = 'MODEL_LEFT_ROOM';

const mapStateToProps = (state) => ({
  streamSettings: state.streaming.settings,
  user: state.user.current,
  activeConversation: state.streamMessage.activeConversation
});

const mapDispatches = {
  dispatchGetStreamConversation: getStreamConversation,
  dispatchResetStreamMessage: resetStreamMessage,
  dispatchUpdateBalance: updateCurrentUserBalance,
  dispatchResetStreamConversation: resetStreamConversation,
  dispatchGetStreamConversationSuccess: getStreamConversationSuccess
};

const connector = connect(mapStateToProps, mapDispatches);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = {
  performer: IPerformer
};

function UserGroupChat({
  performer,
  user,
  activeConversation,
  // streamSettings,
  dispatchUpdateBalance,
  dispatchGetStreamConversation,
  dispatchGetStreamConversationSuccess,
  dispatchResetStreamConversation,
  dispatchResetStreamMessage
}: Props & PropsFromRedux) {
  const streamRef = useRef(null);
  const interval = useRef(null);
  const activeConversationRef = useRef(activeConversation);
  const [roomJoined, setRoomJoined] = useState(false);
  const [participant, setParticipant] = useState({
    total: 0,
    members: []
  });
  const [callTime, setCallTime] = useState(0);
  const [paidToken, setPaidToken] = useState(0);
  const paidTokenRef = useRef(0);
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const router = useRouter();
  const [settings, setSetting] = useState(null);
  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'defaultGroupChatImage'
    ]);
    setSetting(metaSettings.data);
  };

  const dataSource = [
    {
      // title: 'Status',
      description: roomJoined ? 'Live' : ''
    },
    {
      // title: 'Call time',
      description: `${callTime} minute(s)`
    },

    {
      title: 'Paid: ',
      description: `${paidToken} token(s)`
    },
    {
      title: 'Per minute: ',
      description: `${performer.groupCallPrice} token(s)` || 'N/A'
    }
  ];

  const handlerInformationChange = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setParticipant({
        total,
        members
      });
    }
  };

  const stopBroadcast = () => {
    streamRef.current?.stop();
    message.info('Stopped stream. Redirecting...');
    setTimeout(() => {
      window.location.href = `/profile/${performer.username}`;
    }, 10 * 1000);
  };

  const sendPaidToken = async (conversationId: string) => {
    try {
      if (user.balance < performer.groupCallPrice) {
        message.warn('Your balance is not enough token. Redirecting...');

        setTimeout(() => {
          window.location.href = `/profile/${performer.username}`;
        }, 5 * 1000);
        return;
      }

      await transactionService.sendPaidToken(conversationId);
      setPaidToken(paidTokenRef.current + performer.groupCallPrice);
      dispatchUpdateBalance(performer.groupCallPrice * -1);
      interval.current = setTimeout(() => {
        setCallTime((t) => t + 1);
        sendPaidToken(conversationId);
      }, 60 * 1000);
    } catch (err) {
      const error = await Promise.resolve(err);
      if (error.statusCode === 400) {
        message.error('Your tokens do not enough, please buy more.');
        clearInterval(interval.current);
      }

      clearInterval(interval.current);
      stopBroadcast();
    }
  };

  const roomJoinedHandler = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      // pay by token
      sendPaidToken(conversationId);

      setParticipant({
        total,
        members
      });
      setRoomJoined(true);
      setCallTime(0);
    }
  };

  const handleModelLeftRoom = (data: { conversationId: string }) => {
    if (data.conversationId !== activeConversationRef.current.data._id) return;

    message.info('Group stream has ended. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const handleConnect = () => {
    const socket = getSocket();
    if (socket) {
      socket.on(STREAM_EVENT.STREAM_INFORMATION_CHANGED, handlerInformationChange);
      socket.on(STREAM_EVENT.JOINED_THE_ROOM, roomJoinedHandler);
      socket.on(MODEL_LEFT_ROOM, handleModelLeftRoom);
    }
  };

  const handleDisconnect = () => {
    const socket = getSocket();
    if (socket) {
      socket.off(STREAM_EVENT.STREAM_INFORMATION_CHANGED, handlerInformationChange);
      socket.off(STREAM_EVENT.JOINED_THE_ROOM, roomJoinedHandler);
      socket.off(MODEL_LEFT_ROOM, handleModelLeftRoom);
    }
  };

  useEffect(() => {
    if (!connected()) return handleDisconnect();

    handleConnect();

    return handleDisconnect;
  }, [socketStatus]);

  const leaveSession = () => {
    // TODO - check if we don't need to do these actions
    dispatchResetStreamMessage();

    const socket = getSocket();
    socket && socket.off(STREAM_EVENT.STREAM_INFORMATION_CHANGED, handlerInformationChange);
    socket && socket.off(STREAM_EVENT.JOINED_THE_ROOM, roomJoinedHandler);
    socket && socket.off(MODEL_LEFT_ROOM, handleModelLeftRoom);

    if (socket && activeConversationRef.current?.data) {
      socket.emit(STREAM_EVENT.LEAVE_ROOM, {
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

  const joinGroupChat = async () => {
    if (user.balance < performer.groupCallPrice) {
      message.error('Oops, you don’t have enough tokens');
      return;
    }

    try {
      const resp = await streamService.joinGroupChat(performer._id);
      if (resp && resp.data) {
        const socket = getSocket();
        streamRef.current?.start(resp.data.sessionId, resp.data.conversation._id);
        dispatchGetStreamConversationSuccess({
          data: resp.data.conversation
        });
        dispatchGetStreamConversation({
          conversation: resp.data.conversation
        });
        socket.emit(STREAM_EVENT.JOIN_ROOM, {
          conversationId: resp.data.conversation._id
        });
        message.success('Joined group chat!');
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error({ content: getResponseError(error), key: 'stream_group_starting_error' });
      throw new Error(error);
    }
  };

  const onbeforeunload = () => {
    leaveSession();
  };

  useEffect(() => {
    activeConversationRef.current = activeConversation;
    getSettingKeys();
    // Assign previous value of paid token to paidTokenRef
    paidTokenRef.current = paidToken;
  }, [activeConversation, paidToken]);

  useEffect(() => {
    window.addEventListener('beforeunload', onbeforeunload);
    router.events.on('routeChangeStart', onbeforeunload);

    return () => {
      window.removeEventListener('beforeunload', onbeforeunload);
      router.events.off('routeChangeStart', onbeforeunload);
    };
  }, []);

  return (
    <div className={style['group-chat-user']}>
      <Head>
        <title>Group Chat</title>
      </Head>
      <div>
        <Header performer={performer} />
        <Row>
          <Col lg={12} md={12} xs={24}>
            <div className="box-video-group">
              <GroupChatContainer
                ref={streamRef}
                configs={{ localVideoId: 'localVideoId' }}
                onClick={joinGroupChat}
                performer={performer}
                requestFromUser
              />
              {performer.isOnline && !roomJoined
              && (
                <div className="price-call">
                  <div
                    className="bg-full-stream"
                    style={{
                      backgroundImage: getStreamBackground(performer?.avatar, settings, 'group')
                    }}
                  />
                  <div>
                    <img src={performer.avatar} alt={performer.username} />
                    <p>Group chat</p>
                    Per minute:
                    {performer.groupCallPrice}
                    {' '}
                    token(s)
                  </div>
                </div>
              )}
              {performer.isOnline && roomJoined
              && (
                <List
                  dataSource={dataSource}
                  renderItem={(item) => (
                    <ListItem description={item.description} title={item.title} />
                  )}
                />
              )}
              {!performer.isOnline && (
              <div className="price-call">
                <div
                  className="bg-full-stream"
                  style={{
                    backgroundImage: getStreamBackground(performer?.avatar, settings, 'group')
                  }}
                />
                <div>
                  <img src={performer.avatar} alt={performer.username} />
                  <p>
                    {performer.username}
                    {' '}
                    is offline
                  </p>
                </div>
              </div>
              )}
            </div>
          </Col>
          <Col lg={12} md={12} xs={24}>
            <ChatBox
              activeConversation={activeConversation}
              currentPerformer={performer}
              totalParticipant={participant.total}
              members={participant.members}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}

UserGroupChat.authenticate = true;

UserGroupChat.getInitialProps = async (ctx) => {
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
UserGroupChat.layout = 'stream';
export default connector(UserGroupChat);
