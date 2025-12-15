import ListItem from '@components/common/base/list-item';
import PageTitle from '@components/common/page-title';
import ChatBox from '@components/stream-chat/chat-box';
import styles from '@components/streaming/group-streaming-container.module.less';
import Header from '@components/streaming/header';
import GroupPublisher from '@components/streaming/webrtc/groupchat/publisher';
import GroupSubscriber from '@components/streaming/webrtc/groupchat/subscriber';
import { getStreamBackground } from '@lib/styles';
import { getResponseError, redirect } from '@lib/utils';
import {
  getStreamConversationSuccess,
  loadMoreStreamMessages,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Button,
  Col, List, message, Row
} from 'antd';
import classNames from 'classnames';
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
  performerService, settingService, streamService, transactionService
} from 'src/services';
import { SocketContext } from 'src/socket';

import style from '../../index.module.less';

// eslint-disable-next-line no-shadow
enum EVENT {
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  SEND_PAID_TOKEN = 'SEND_PAID_TOKEN'
}
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';
const MODEL_LEFT_ROOM = 'MODEL_LEFT_ROOM';
const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEFT = 'private-stream/streamLeft';

const mapStateToProps = (state) => ({
  streamSettings: state.streaming.settings,
  ui: state.ui,
  user: state.user.current,
  loggedIn: state.auth.loggedIn,
  singularTextModel: state.ui.singularTextModel,
  activeConversation: state.streamMessage.activeConversation
});
const mapDispatches = {
  dispatchGetStreamConversationSuccess: getStreamConversationSuccess,
  dispatchLoadStreamMessages: loadMoreStreamMessages,
  dispatchResetStreamMessage: resetStreamMessage,
  dispatchUpdateBalance: updateCurrentUserBalance,
  dispatchResetStreamConversation: resetStreamConversation
};

const connector = connect(mapStateToProps, mapDispatches);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = {
  performer: IPerformer,
};

function UserGroupChat({
  performer,
  user,
  activeConversation,
  streamSettings,
  // singularTextModel = 'Performer',
  dispatchUpdateBalance,
  dispatchGetStreamConversationSuccess,
  dispatchResetStreamConversation,
  dispatchResetStreamMessage,
  dispatchLoadStreamMessages
}: Props & PropsFromRedux) {
  const streamRef = useRef(null);
  const publisherRef = useRef(null);
  const subscriberRef = useRef(null);
  const streamIdRef = useRef(null);
  const streamListRef = useRef([]);
  const activeConversationRef = useRef(activeConversation);
  const interval = useRef(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const [participant, setParticipant] = useState({
    total: 0,
    members: []
  });

  const [callTime, setCallTime] = useState(0);
  const [paidToken, setPaidToken] = useState(0);
  const paidTokenRef = useRef(0);
  const [processing, setProcessing] = useState(false);
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const router = useRouter();
  const [settings, setSetting] = useState(null);
  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'defaultGroupChatImage'
    ]);
    setSetting(metaSettings.data);
  };

  const localVideoId = 'group-publisher';
  const remoteVideoContainerClassname = 'group-video-container';
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

    message.info('Streaming stopped. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const leave = () => {
    publisherRef?.current.stop();
    subscriberRef?.current.stop();

    message.info('Streaming stopped. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const sendPaidToken = async (conversationId: string) => {
    try {
      if (user.balance < performer.groupCallPrice) {
        message.warn('Your balance is not enough token. Redirect to homepage in 3 seconds');

        setTimeout(() => {
          window.location.href = `/profile/${performer.username}`;
        }, 3 * 1000);
        return;
      }

      await transactionService.sendPaidToken(conversationId);
      setPaidToken(paidTokenRef.current + performer.groupCallPrice);
      dispatchUpdateBalance(performer.groupCallPrice * -1);
      setTimeout(() => {
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
      leave();
      stopBroadcast();
    }
  };

  const joinGroupChat = async () => {
    try {
      setProcessing(true);
      const resp = await streamService.joinGroupChat(performer._id);
      if (resp && resp.data) {
        const { sessionId, conversation } = resp.data;
        publisherRef.current?.start(conversation._id, sessionId);
        dispatchGetStreamConversationSuccess({
          data: conversation
        });
        dispatchLoadStreamMessages({
          conversationId: conversation._id,
          limit: 25,
          offset: 0,
          type: conversation.type
        });

        const socket = getSocket();

        socket.emit(EVENT.JOIN_ROOM, {
          conversationId: conversation._id
        });
        message.success('Joined group chat!');
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setProcessing(false);
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

  const handleJoinedTheRoom = ({ streamId, streamList, conversationId }) => {
    if (conversationId !== activeConversationRef.current.data._id) return;

    streamIdRef.current = streamId;
    streamListRef.current = streamList;
    publisherRef.current?.publish(streamId);
    if (streamList.length) {
      subscriberRef.current.play(streamList);
    }
  };

  const handleStreamJoined = (data: { streamId: string, conversationId: string }) => {
    if (data.conversationId !== activeConversationRef.current.data._id) return;

    if (streamIdRef.current !== data.streamId) {
      subscriberRef.current?.play([data.streamId]);
    }
  };

  const handleStreamLeft = (data: { streamId: string, conversationId: string }) => {
    if (data.conversationId !== activeConversationRef.current.data._id) return;

    streamListRef.current = streamListRef.current.filter((id) => id !== data.streamId);
    if (streamIdRef.current !== data.streamId) {
      subscriberRef.current?.close(data.streamId);
    }
  };

  const handleModelLeftRoom = (data: { conversationId: string }) => {
    if (data.conversationId !== activeConversationRef.current.data._id) return;

    message.info('Group stream has ended. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const initSocketEvent = () => {
    const socket = getSocket();
    socket && socket.on(JOINED_THE_ROOM, handleJoinedTheRoom);
    socket && socket.on(STREAM_JOINED, handleStreamJoined);
    socket && socket.on(STREAM_LEFT, handleStreamLeft);
    socket && socket.on(MODEL_LEFT_ROOM, handleModelLeftRoom);
    socket && socket.on(EVENT.STREAM_INFORMATION_CHANGED, handlerInformationChange);
    socket && socket.on(JOINED_THE_ROOM, roomJoinedHandler);
  };

  const leaveSession = () => {
    dispatchResetStreamMessage();

    const socket = getSocket();

    // TODO - do we need these?
    socket && socket.off(JOINED_THE_ROOM, handleJoinedTheRoom);
    socket && socket.off(STREAM_JOINED, handleStreamJoined);
    socket && socket.off(STREAM_LEFT, handleStreamLeft);
    socket && socket.off(MODEL_LEFT_ROOM, handleModelLeftRoom);
    if (activeConversationRef.current?.data) {
      socket && socket.emit(EVENT.LEAVE_ROOM, {
        conversationId: activeConversationRef.current.data._id
      });
    }

    if (interval.current) {
      clearInterval(interval.current);
    }

    dispatchResetStreamConversation();

    setProcessing(false);
    setRoomJoined(false);
    setParticipant({
      total: 0,
      members: []
    });
  };

  const onbeforeunload = () => {
    leaveSession();
  };

  useEffect(() => {
    activeConversationRef.current = activeConversation;
    getSettingKeys();
    // Assign previous value of paid token to paidTokenRef
    paidTokenRef.current = paidToken;
  }, [activeConversation]);

  useEffect(() => {
    if (connected()) initSocketEvent();
  }, [socketStatus]);

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
      <PageTitle title="Group chat" />
      <Header performer={performer} />
      <div className={style['group-chat-user']}>
        <Row>
          <Col md={12} xs={24}>
            <div className="box-video-group">
              <div className={classNames(styles['stream-group-main'], { [styles.streaming_group_show]: roomJoined })}>
                <div className="button-streaming">
                  {performer?.isOnline && (
                    !roomJoined ? (
                      <Button
                        type="primary"
                        onClick={joinGroupChat}
                        loading={processing}
                        block
                        disabled={!connected()}
                      >
                        Join Group chat
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={leave}
                        block
                        disabled={processing}
                      >
                        Stop Streaming
                      </Button>
                    )
                  )}

                </div>
                {/* <GroupChatContainer
                  ref={streamRef}
                  configs={{ localVideoId: 'localVideoId' }}
                  onClick={joinGroupChat}
                  performer={performer}
                  requestFromUser
                /> */}
                <div style={{ position: 'relative' }} className="stream-group">
                  <div id="group-video-container" className="group-video-webrtc">

                    <GroupSubscriber
                      settings={streamSettings}
                      performerId={performer._id}
                      ref={subscriberRef}
                      containerClassName={remoteVideoContainerClassname}
                      configs={{
                        isPlayMode: true
                      }}
                    />

                    <div id="main-video" />
                    <div id="sub-viewers" hidden={!roomJoined}>
                      <GroupPublisher
                        settings={streamSettings}
                        ref={publisherRef}
                        containerClassName={remoteVideoContainerClassname}
                        configs={{
                          localVideoId
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
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
          <Col xs={24} md={12}>
            <ChatBox
              activeConversation={activeConversation}
              currentPerformer={performer}
              totalParticipant={participant.total}
              members={participant.members}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}

UserGroupChat.authenticate = true;
UserGroupChat.layout = 'stream';

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

export default connector(UserGroupChat);
