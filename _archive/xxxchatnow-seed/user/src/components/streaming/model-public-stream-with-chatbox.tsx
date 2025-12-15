import StreamStatusUpdateForm from '@components/performer/stream-status-update-form';
import ChatBox from '@components/stream-chat/chat-box';
import { getResponseError } from '@lib/utils';
import {
  getStreamConversationSuccess, loadStreamMessages, resetAllStreamMessage, resetStreamConversation, resetStreamMessage
} from '@redux/stream-chat/actions';
import { messageService } from '@services/message.service';
import { streamService } from '@services/stream.service';
import {
  Button, ButtonProps, Col, Descriptions, message, Modal, Row, Space
} from 'antd';
import { useRouter } from 'next/router';
import {
  RefAttributes, useContext, useEffect, useRef, useState
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { IPerformer } from 'src/interfaces';
import { Event, SocketContext } from 'src/socket';

import GoalsForm from './goals-form';
import style from './model-public-stream-with-chatbox.module.less';
import { LivePublisher } from './publisher';
import { StreamGoals } from './stream-goals';

// eslint-disable-next-line no-shadow
enum EVENT_NAME {
  ROOM_INFORMATIOM_CHANGED = 'public-room-changed',
  USER_LEFT_ROOM = 'USER_LEFT_ROOM'
}

type Props = {
  performer: IPerformer;
}

const mapStates = (state) => ({
  ui: state.ui,
  streamSettings: state.streaming.settings,
  loggedIn: state.auth.loggedIn,
  activeConversation: state.streamMessage.activeConversation
});

const mapDispatch = {
  dispatchLoadStreamMessages: loadStreamMessages,
  dispatchGetStreamConversationSuccess: getStreamConversationSuccess,
  dispatchResetStreamMessage: resetStreamMessage,
  dispatchResetAllMessage: resetAllStreamMessage,
  dispatchResetStreamConversation: resetStreamConversation
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function ModelPublicStreamWithChatBox({
  performer,
  activeConversation,
  dispatchGetStreamConversationSuccess,
  dispatchResetStreamConversation,
  dispatchLoadStreamMessages,
  dispatchResetAllMessage,
  dispatchResetStreamMessage,
  streamSettings
}: Props & PropsFromRedux) {
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const router = useRouter();
  const publisherRef = useRef<any>(null);
  const joinRoomCheckRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [publishStarted, setPublishStarted] = useState(false);
  const [participant, setParticipant] = useState({
    members: [],
    total: 0
  });
  const activeConversationRef = useRef<any>();
  const [visibleRMTPModal, setVisibleRTMPModal] = useState(false);

  const webrtcCallback = async (info: WEBRTC_ADAPTOR_INFORMATIONS) => {
    if (activeConversation?.data) {
      if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
        setInitialized(true);
        try {
          setLoading(true);
          const resp = await streamService.goLive();
          publisherRef.current.publish(resp.data.sessionId);
        } catch (e) {
          const error = await Promise.resolve(e);
          message.error(getResponseError(error));
          setLoading(false);
        }
      } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_STARTED || info === WEBRTC_ADAPTOR_INFORMATIONS.SESSION_RESTORED_DESCRIPTION) {
        setPublishStarted(true);
        setLoading(false);
        const socket = getSocket();
        socket.emit('public-stream/live', {
          conversationId: activeConversation.data._id
        });
      } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_FINISHED) {
        setLoading(false);
        setPublishStarted(false);
      } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.CLOSED) {
        // setLoading(false);
        // setPublishStarted(false);
        // setInitialized(false);
      }
    }
  };

  const roomChangeHandler = ({ total, members, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      setParticipant({ total, members });
    }
  };

  const userLeftRoomHandler = ({ username, conversationId }) => {
    if (activeConversationRef.current?.data?._id === conversationId) {
      const { total, members } = participant;
      const member = members.find((m) => m.username === username);
      member && setParticipant({
        total: total - 1,
        members: members.filter((m) => m.username !== username)
      });
    }
  };

  const joinPublicRoom = async () => {
    try {
      setFetching(true);
      const resp = await streamService.goLive();
      const { conversation } = resp.data;
      if (conversation && conversation._id) {
        // this.publisherRef && this.publisherRef.start();
        dispatchGetStreamConversationSuccess({ data: conversation });
        dispatchLoadStreamMessages({
          conversationId: conversation._id,
          limit: 25,
          offset: 0,
          type: conversation.type
        });
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setFetching(false);
    }
  };

  const leavePublicRoom = () => {
    if (activeConversationRef.current && publishStarted) {
      const conversation = { ...activeConversationRef.current.data };
      const socket = getSocket();
      socket && socket.emit('public-stream/leave', {
        conversationId: conversation._id
      });
      dispatchResetStreamMessage();
      dispatchResetStreamConversation();
    }
  };

  const start = () => {
    publisherRef.current.start();
  };

  const stop = () => {
    if (!initialized || !publishStarted) {
      window.location.reload();
      return;
    }

    if (window.confirm('Are you sure want to stop this live streaming!')) {
      leavePublicRoom();
      window.location.reload();
    }
  };

  const removeAllMessages = async () => {
    if (
      !activeConversation.data
      || performer._id !== activeConversation.data.performerId
    ) {
      return;
    }

    try {
      if (!window.confirm('Are you sure you want to remove chat history?')) {
        return;
      }
      await messageService.deleteAllMessageInConversation(
        activeConversation.data._id
      );
      dispatchResetAllMessage({ conversationId: activeConversation.data._id });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  const onbeforeunload = () => {
    leavePublicRoom();
  };

  const onBlockUser = (u) => {
    const index = participant.members.findIndex((p) => p._id === u.userId);
    if (index > -1) {
      const members = [...participant.members];
      const total = participant.total - 1;
      members.splice(index, 1);
      setParticipant({
        members,
        total: total < 0 ? 0 : total
      });
    }
  };

  const btnProps: ButtonProps & RefAttributes<HTMLElement> = {
    loading,
    disabled: fetching,
    block: true
  };
  if (initialized && publishStarted) {
    btnProps.type = 'text';
    btnProps.style = { background: 'black', color: 'white' };
    btnProps.children = 'Stop broadcasting';
    btnProps.onClick = () => stop();
  } else {
    btnProps.type = 'primary';
    btnProps.children = 'Start broadcasting';
    btnProps.onClick = () => start();
  }

  useEffect(() => {
    window.addEventListener('beforeunload', onbeforeunload);
    router.events.on('routeChangeStart', onbeforeunload);

    return () => {
      window.removeEventListener('beforeunload', onbeforeunload);
      router.events.off('routeChangeStart', onbeforeunload);
    };
  }, []);

  useEffect(() => {
    joinPublicRoom();
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
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  return (
    <Row className={style['public-stream-with-chatbox']}>
      <Event
        event={EVENT_NAME.ROOM_INFORMATIOM_CHANGED}
        handler={roomChangeHandler}
      />
      <Event
        event={EVENT_NAME.USER_LEFT_ROOM}
        handler={userLeftRoomHandler}
      />
      <Col xs={24} sm={24} md={12}>
        <StreamStatusUpdateForm status={performer.streamingTitle} />
        {/* <div className={style['stream-footer-desktop']}><Button {...btnProps} /></div> */}
        <div className="stream-box-model">
          <div className="stream-box-model-bg">
            <LivePublisher
              watermark={performer.watermark}
              ref={publisherRef}
              onChange={webrtcCallback}
              configs={{
                debug: process.env.DEBUG === 'true',
                bandwidth: 900,
                localVideoId: 'publisher'
              }}
            />
          </div>
          <StreamGoals streamId={activeConversation?.data?.streamId} conversationId={activeConversation?.data?._id} />
          <div className="stream-footer-mobile">
            <Space>
              <Button {...btnProps} />
              <Button hidden={publishStarted || initialized} onClick={() => setVisibleRTMPModal(true)}>Publish with RTMP</Button>
            </Space>
          </div>
        </div>
        <div className={style['stream-footer-mobile']}>
          <div className="stream-footer-mobile-btn">
            <span onClick={removeAllMessages} role="link" tabIndex={0}>Clear message history</span>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12}>
        <ChatBox
          activeConversation={activeConversation}
          members={participant.members}
          totalParticipant={participant.total}
          currentPerformer={performer}
          onBlockUser={onBlockUser}
        // userRanking={currentUserRank}
        />

        {
          activeConversation?.data && (
            <div style={{ margin: '10px' }} className="desktop-show">
              <Button
                type="primary"
                onClick={removeAllMessages}
              >
                Clear message history
              </Button>
            </div>
          )
        }
        {activeConversation.data?.streamId && <GoalsForm streamId={activeConversation.data.streamId} />}
      </Col>
      <Modal okButtonProps={{ hidden: true }} visible={visibleRMTPModal} onCancel={() => setVisibleRTMPModal(false)}>
        <Descriptions layout="vertical" column={1}>
          <Descriptions.Item label="Server">{`rtmp://${streamSettings.publisherURL}/${streamSettings.AntMediaAppname}/`}</Descriptions.Item>
          <Descriptions.Item label="Stream Key">{activeConversation.data?.streamId}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </Row>
  );
}
ModelPublicStreamWithChatBox.layout = 'stream';
export default connector(ModelPublicStreamWithChatBox);
