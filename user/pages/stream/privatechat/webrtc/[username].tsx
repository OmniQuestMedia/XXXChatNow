import ListItem from '@components/common/base/list-item';
import ChatBox from '@components/stream-chat/chat-box';
import Header from '@components/streaming/header';
import streamStyle from '@components/streaming/streaming-container.module.less';
import { getStreamBackground } from '@lib/styles';
import { getResponseError, redirect } from '@lib/utils';
import {
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Button,
  Col, List, message, Row
} from 'antd';
import classnames from 'classnames';
import Head from 'next/head';
import nextCookie from 'next-cookies';
import React, {
  useContext, useEffect,
  useRef, useState
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import PrivatePublisher from 'src/components/streaming/webrtc/privatechat/publisher';
import PrivateSubscriber from 'src/components/streaming/webrtc/privatechat/subscriber';
import { IPerformer, IUser } from 'src/interfaces';
import {
  performerService,
  settingService,
  streamService,
  transactionService
} from 'src/services';
import { Event, SocketContext } from 'src/socket';

import style from '../style.module.less';

// must use forwardRef
// const PrivatePublisher = dynamic(() => (import('src/components/streaming/webrtc/privatechat/publisher')), { ssr: false });
// const PrivateSubscriber = dynamic(() => (import('src/components/streaming/webrtc/privatechat/subscriber')), { ssr: false });

// eslint-disable-next-line no-shadow
enum EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged',
  MODEL_JOIN_ROOM = 'MODEL_JOIN_ROOM',
  SEND_PAID_TOKEN = 'SEND_PAID_TOKEN'
}

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEFT = 'private-stream/streamLeft';
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';
const MODEL_LEFT_ROOM = 'MODEL_LEFT_ROOM';

const mapStateToProps = (state) => ({
  user: state.user.current,
  activeConversation: state.streamMessage.activeConversation,
  singularTextModel: state.ui.singularTextModel,
  streamSettings: state.streaming.settings
});
const mapDispatches = {
  dispatchGetStreamConversationSuccess: getStreamConversationSuccess,
  dispatchResetStreamMessage: resetStreamMessage,
  dispatchUpdateBalance: updateCurrentUserBalance,
  dispatchResetStreamConversation: resetStreamConversation
};

const connector = connect(mapStateToProps, mapDispatches);

type PropsFromRedux = ConnectedProps<typeof connector>;

type IProps = {
  performer: IPerformer;
  user: IUser;
};

function UserPrivateChat({
  performer,
  user,
  activeConversation,
  streamSettings,
  singularTextModel = 'Performer',
  dispatchUpdateBalance,
  dispatchResetStreamMessage,
  dispatchGetStreamConversationSuccess,
  dispatchResetStreamConversation
}: IProps & PropsFromRedux) {
  const publisherRef = useRef(null);
  const subscriberRef = useRef(null);
  const streamListRef = useRef([]);
  const streamIdRef = useRef(null);
  const activeConversationRef = useRef(activeConversation);
  const interval = useRef(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [modelJoined, setModelJoined] = useState(false);
  const [participant, setParticipant] = useState({
    total: 0,
    members: []
  });
  const [callTime, setCallTime] = useState(0);
  const [paidToken, setPaidToken] = useState(0);
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const [settings, setSetting] = useState(null);

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

  const handleModelLeftRoom = (data: { conversationId: string }) => {
    if (data.conversationId !== activeConversationRef.current.data._id) return;

    message.error('Private stream has ended. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const leaveSession = () => {
    dispatchResetStreamMessage();
    const socket = getSocket();
    if (socket && activeConversationRef.current?.data) {
      socket.off(JOINED_THE_ROOM);
      socket.off(STREAM_JOINED);
      socket.off(STREAM_LEFT);
      socket.off(MODEL_LEFT_ROOM, handleModelLeftRoom);
      socket.emit(EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
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

  const leave = () => {
    publisherRef.current?.stop();
    subscriberRef.current?.stop();

    leaveSession();

    message.info('Streaming stopped. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  };

  const sendPaidToken = async (conversationId: string) => {
    try {
      await transactionService.sendPaidToken(conversationId);
      setPaidToken((prevState) => prevState + performer.privateCallPrice);
      dispatchUpdateBalance(performer.privateCallPrice * -1);
    } catch (err) {
      const error = await Promise.resolve(err);
      if (error.statusCode === 400) {
        message.error('Your tokens do not enough, please buy more.');
        clearInterval(interval.current);
        leave();
      }
    }
  };

  const handlerInfoChange = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setParticipant({
        total,
        members
      });
    }
  };

  const handleModelJoinRoom = ({ conversationId }) => {
    message.success(`${singularTextModel} joined the room!`);
    setModelJoined(true);
    if (activeConversationRef.current?.data?._id === conversationId) {
      if (user.balance < performer.privateCallPrice) {
        message.warn('Your balance is not enough token! Redirecting...');
        setTimeout(() => window.location.reload(), 5 * 1000);
      } else {
        sendPaidToken(conversationId);
        interval.current = setInterval(() => {
          setCallTime((prevState) => prevState + 1);
          sendPaidToken(conversationId);
        }, 60 * 1000);
      }
    }
  };

  const sendRequest = async () => {
    if (user.balance < performer.privateCallPrice) {
      message.error('Oops, you don’t have enough tokens');
    }

    try {
      if (performer.streamingStatus === 'private') {
        message.error(`${singularTextModel} is streaming private, please connect after some time`);
      }

      setProcessing(true);
      const resp = await streamService.requestPrivateChat(performer._id);
      const { sessionId, conversation } = resp.data;
      dispatchGetStreamConversationSuccess({
        data: conversation
      });

      message.success('Private request has been sent!');

      publisherRef.current?.start(conversation._id, sessionId);

      const socket = getSocket();
      socket.emit(EVENT.JOIN_ROOM, {
        conversationId: conversation._id
      });

      setRequested(true);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setProcessing(false);
    }
  };

  const roomJoinedHandler = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setRoomJoined(true);
      setParticipant({
        total,
        members
      });
      setCallTime(0);
    }
  };

  /**
   * reload page after end stream, dont need to care in case reset socket
   */
  const initSocketEvent = () => {
    const socket = getSocket();
    socket && socket.on(MODEL_LEFT_ROOM, handleModelLeftRoom);

    socket.on(
      JOINED_THE_ROOM,
      ({ streamId, streamList, conversationId }) => {
        if (conversationId !== activeConversationRef.current?.data._id) return;

        streamIdRef.current = streamId;
        streamListRef.current = streamList;

        publisherRef.current?.publish(streamId);
      }
    );

    socket.on(
      STREAM_JOINED,
      (data: { streamId: string; conversationId: string }) => {
        if (data.conversationId !== activeConversationRef.current?.data._id) return;

        if (streamIdRef.current !== data.streamId) {
          // settings.optionForPrivate === 'webrtc' ? this.setState({ newAvailableStreams: [...newAvailableStreams, data.streamId] }) : this.subscribeHLS(data.streamId);
          subscriberRef.current?.play(data.streamId);
        }
      }
    );

    socket.on(
      STREAM_LEFT,
      (data: { streamId: string; conversationId: string }) => {
        if (data.conversationId !== activeConversationRef.current?.data._id) return;

        streamListRef.current = streamListRef.current.filter((id) => id !== data.streamId);
        if (streamIdRef.current !== data.streamId) {
          subscriberRef.current?.close();
        }

        message.error('Private stream has ended. Redirect to homepage in 3 seconds');

        setTimeout(() => {
          window.location.href = '/';
        }, 3 * 1000);
      }
    );
  };

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    if (connected()) {
      initSocketEvent();
    }
  }, [socketStatus]);

  useEffect(() => {
    getSettingKeys();
  }, []);

  return (
    <>
      <Head>
        <title>Private Chat</title>
      </Head>
      <Event
        event={EVENT.STREAM_INFORMATION_CHANGED}
        handler={handlerInfoChange}
      />
      <Event
        event={EVENT.JOINED_THE_ROOM}
        handler={roomJoinedHandler}
      />
      <Event
        event={EVENT.MODEL_JOIN_ROOM}
        handler={handleModelJoinRoom}
      />
      <Header performer={performer} />
      <Row>
        <Col md={12} xs={24}>
          {performer.isOnline && !roomJoined
            && (
              <div className={style['txt-show-chat']}>
                <div
                  className="bg-full-stream"
                  style={{
                    backgroundImage: getStreamBackground(performer?.avatar, settings)
                  }}
                />
                <div>
                  <img src={performer.avatar} alt={performer.username} />
                  <p>Private streaming</p>
                  Per minute:
                  {performer.privateCallPrice}
                  {' '}
                  token(s)
                </div>
                <div className={style['button-start-stream']}>
                  <Button
                    type="primary"
                    onClick={sendRequest}
                    loading={processing || requested}
                    block
                    disabled={processing || requested}
                  >
                    Send Private Call Request
                  </Button>
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
                    <div>
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
                <div className={style['button-start-stream']}>
                  <Button
                    type="primary"
                    onClick={leave}
                    block
                    disabled={processing}
                  >
                    Stop Streaming
                  </Button>
                </div>
              </>
            )}
          {!performer.isOnline && (
            <div className={style['txt-show-chat']}>
              <div
                className="bg-full-stream"
                style={{
                  backgroundImage: getStreamBackground(performer?.avatar, settings)
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
          <div className={classnames(streamStyle['stream-private-main'], {
            [streamStyle['stream-started']]: modelJoined
          })}
          >
            <div className="private-streaming-container">
              <PrivatePublisher
                settings={streamSettings}
                ref={publisherRef}
                configs={{
                  localVideoId: 'private-publisher'
                }}
              />
              <PrivateSubscriber
                settings={streamSettings}
                ref={subscriberRef}
                configs={{
                  isPlayMode: true,
                  remoteVideoId: 'private-subscriber'
                }}
              />
            </div>
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
      return redirect('/403', ctx);
    }

    return {
      performer
    };
  } catch (e) {
    return redirect('/', ctx);
  }
};

export default connector(UserPrivateChat);
