import ChatBox from '@components/stream-chat/chat-box';
import { UserRankCard } from '@components/user/user-rank-card';
import { WheelBtn } from '@components/winwheel/wheel-btn';
import WheelContainer from '@components/winwheel/wheel-container';
import { getPoster } from '@lib/stream';
import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import {
  getStreamConversationSuccess,
  loadStreamMessages,
  receiveStreamMessageSuccess,
  resetAllStreamMessage,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { hideWheel } from '@redux/streaming/actions';
import { messageService } from '@services/message.service';
import { performerService } from '@services/perfomer.service';
import { streamService } from '@services/stream.service';
import {
  Col, message, Row
} from 'antd';
import { useRouter } from 'next/router';
import {
  useContext, useEffect, useRef, useState
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import LiveSubscriber from 'src/components/streaming/subscriber';
import { HLS, IPerformer, WEBRTC } from 'src/interfaces';
import { Event, SocketContext } from 'src/socket';

import Crowdfunding from './crowdfunding';
import Footer from './footer';
import { StreamGoals } from './stream-goals';
import style from './streaming-container.module.less';

const STREAM_EVENT = {
  JOIN_BROADCASTER: 'join-broadcaster',
  MODEL_LEFT: 'model-left',
  ROOM_INFORMATION_CHANGED: 'public-room-changed',
  MODEL_UPDATE_STREAMING_STATUS: 'modelUpdateStreamingStatus',
  USER_LEFT_ROOM: 'USER_LEFT_ROOM'
};

const EVENT = {
  BLOCK_USERS: 'notify_users_block'
};

type IProps = {
  performer: IPerformer;
};

const mapStates = (state) => ({
  ui: state.ui,
  streamSettings: state.streaming.settings,
  user: currentUserSelector(state),
  loggedIn: state.auth.loggedIn,
  activeConversation: state.streamMessage.activeConversation
});

const mapDispatch = {
  dispatchLoadStreamMessages: loadStreamMessages,
  dispatchGetStreamConversationSuccess: getStreamConversationSuccess,
  receiveStreamMessageSuccess,
  dispatchResetStreamMessage: resetStreamMessage,
  resetAllStreamMessage,
  dispatchResetStreamConversation: resetStreamConversation,
  dispatchHideWheel: hideWheel
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

export function PubicStreamViewerWithChatbox({
  loggedIn,
  performer,
  user,
  streamSettings,
  activeConversation,
  dispatchResetStreamMessage,
  dispatchResetStreamConversation,
  dispatchLoadStreamMessages,
  dispatchGetStreamConversationSuccess,
  dispatchHideWheel
}: IProps & PropsFromRedux) {
  const [activeTab, setActiveTab] = useState('chat');
  const { optionForBroadcast = HLS } = streamSettings;

  const subscriberRef = useRef<any>(null);
  const joinRoomCheckRef = useRef(null);
  const timeoutCheckBlockRef = useRef(null);
  const activeConversationRef = useRef<any>();

  const [currentUserRank, setRank] = useState(null);
  const router = useRouter();

  const [participant, setParticipant] = useState({
    members: [],
    total: 0
  });

  const { getSocket, connected, socketStatus } = useContext(SocketContext);
  const subscribe = async ({ performerId }) => {
    try {
      if (performer._id !== performerId) {
        return;
      }
      const resp = await streamService.joinPublicChat(performerId);
      const { sessionId } = resp.data;
      if (optionForBroadcast === HLS) {
        subscriberRef.current?.playHLS(sessionId);
      } else if (optionForBroadcast === WEBRTC) {
        subscriberRef.current?.play(sessionId);
      }
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  };

  const modelLeftHandler = ({ performerId }) => {
    if (performerId !== performer._id) {
      return;
    }

    subscriberRef.current?.stop();
  };

  const userLeftRoomHandle = ({ username, conversationId }) => {
    if (activeConversationRef.current?.activeConversation?.data?._id === conversationId) {
      const leftMemberIndex = participant.members.findIndex((m) => m.username === username);
      if (leftMemberIndex > -1) {
        setParticipant({
          total: participant.total - 1,
          members: participant.members.splice(leftMemberIndex, 1)
        });
      }
    }
  };

  const onRoomChange = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setParticipant({
        total,
        members
      });
    }
  };

  const userBlockHandler = ({ performerId }) => {
    if (performerId === performer._id) {
      message.info('You have been blocked by model!');
      if (activeConversationRef.current) {
        const conversation = { ...activeConversationRef.current.data };
        const socket = getSocket();

        socket && socket.emit('public-stream/leave', {
          conversationId: conversation.data._id
        });
      }

      setTimeout(() => {
        window.location.href = '/';
      }, 3 * 1000);
    }
  };

  const intervalCheckBlock = async () => {
    try {
      if (timeoutCheckBlockRef.current) clearTimeout(timeoutCheckBlockRef.current);
      const resp = await performerService.checkBlock(performer._id);
      if (resp.data.blocked) {
        userBlockHandler({ performerId: performer._id });
      } else {
        timeoutCheckBlockRef.current = setTimeout(intervalCheckBlock, 15000);
      }
    } catch {
      timeoutCheckBlockRef.current = setTimeout(intervalCheckBlock, 15000);
    }
  };

  const modelUpdateStreamingStatusHandler = ({ status, id }) => {
    if (id === performer._id) {
      setTimeout(() => {
        if (subscriberRef.current) {
          subscriberRef.current.poster(
            getPoster(status)
          );
        }
      }, 100);
    }
  };

  const onbeforeunload = () => {
    if (activeConversationRef.current) {
      const conversation = { ...activeConversationRef.current.data };
      const socket = getSocket();
      socket && socket.emit('public-stream/leave', {
        conversationId: conversation._id
      });
    }

    dispatchResetStreamConversation();
    dispatchResetStreamMessage();
  };

  const joinPerformerPublicRoom = async () => {
    try {
      const resp = await messageService.findPublicConversationPerformer(
        performer._id
      );
      if (user?._id) {
        const rank = await performerService.checkUserRank(performer._id);
        setRank(rank.data);
      }
      const conversation = resp.data;
      if (conversation && conversation._id) {
        dispatchGetStreamConversationSuccess({ data: conversation });
        dispatchLoadStreamMessages({
          conversationId: conversation._id,
          limit: 25,
          offset: 0,
          type: conversation.type
        });
      } else {
        throw new Error('No available broadcast. Try again later');
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  useEffect(() => {
    router.events.on('routeChangeStart', onbeforeunload);
    window.addEventListener('beforeunload', onbeforeunload);

    return () => {
      router.events.off('routeChangeStart', onbeforeunload);
      window.removeEventListener('beforeunload', onbeforeunload);
    };
  }, []);

  useEffect(() => {
    if (!connected()) {
      joinRoomCheckRef.current = false;
    }

    // TODO - recheck and optimize me?
    if (!joinRoomCheckRef.current && connected() && activeConversation?.data?._id) {
      const socket = getSocket();
      socket.emit('public-stream/join', {
        conversationId: activeConversation.data._id
      });
      joinRoomCheckRef.current = true;
    }
  }, [socketStatus, activeConversation]);

  useEffect(() => {
    if (!performer) return null;

    joinPerformerPublicRoom();

    const { streamingStatus } = performer;
    subscriberRef.current.resetPlaybackVideo(
      getPoster(streamingStatus)
    );

    if (loggedIn) {
      intervalCheckBlock();
    }

    return () => {
      if (timeoutCheckBlockRef.current) {
        clearTimeout(timeoutCheckBlockRef.current);
      }
    };
  }, [performer]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  return (
    <Row className={style['streaming-container']}>
      <Event
        event={STREAM_EVENT.JOIN_BROADCASTER}
        handler={subscribe}
      />
      <Event
        event={STREAM_EVENT.MODEL_LEFT}
        handler={modelLeftHandler}
      />
      <Event
        event={STREAM_EVENT.USER_LEFT_ROOM}
        handler={userLeftRoomHandle}
      />
      <Event
        event={STREAM_EVENT.ROOM_INFORMATION_CHANGED}
        handler={onRoomChange}
      />
      <Event
        event={EVENT.BLOCK_USERS}
        handler={userBlockHandler}
      />
      <Event
        event={STREAM_EVENT.MODEL_UPDATE_STREAMING_STATUS}
        handler={modelUpdateStreamingStatusHandler}
      />
      <Col lg={14} md={24} xs={24} id="public-stream-col">
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <LiveSubscriber
            ref={subscriberRef}
            configs={{
              isPlayMode: true,
              debug: process.env.DEBUG
            }}
            performer={performer}
          />
          <div className={style['stream-icons-action']}>
            <WheelBtn
              performer={performer}
            >
              <img
                src="/icons/wheel-icon.svg"
                alt=""
                width={20}
                height={20}
              />
            </WheelBtn>
            <WheelContainer
              performer={performer}
              cancel={() => dispatchHideWheel()}
              conversationId={activeConversation?.data?._id}
            />
          </div>
        </div>
        <Footer
          performer={performer}
          settings={streamSettings}
          onTabChange={(t) => setActiveTab(t)}
          activeTab={activeTab}
          totalParticipant={participant.total}
        />
        <Crowdfunding performer={performer} />
        <StreamGoals streamId={activeConversation?.data?.streamId} conversationId={activeConversation?.data?._id} />
      </Col>
      <Col lg={10} md={24} xs={24} hidden={activeTab === 'bio'} className="chatbox-public">
        <ChatBox
          activeConversation={activeConversation}
          currentPerformer={performer}
          members={participant.members}
          totalParticipant={participant.total}
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          activeCommunityChat
        />
        {user?._id && currentUserRank && (
          <div className="user-ranking">
            <UserRankCard rank={currentUserRank} />
          </div>
        )}
      </Col>
    </Row>
  );
}

export default connector(PubicStreamViewerWithChatbox);
