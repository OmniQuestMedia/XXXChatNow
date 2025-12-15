import ChatBox from '@components/stream-chat/chat-box';
import { Description } from '@components/streaming';
import styles from '@components/streaming/group-streaming-container.module.less';
import { getResponseError } from '@lib/utils';
import { updateCurrentPerformerBalance } from '@redux/performer/actions';
import {
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import {
  Button,
  Col, message, Row
} from 'antd';
import classNames from 'classnames';
import Header from 'next/head';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import GroupPublisher from 'src/components/streaming/webrtc/groupchat/publisher';
import GroupSubscriber from 'src/components/streaming/webrtc/groupchat/subscriber';
import { IUser } from 'src/interfaces';
import { streamService } from 'src/services';
import { Event, SocketContext } from 'src/socket';
import { ISocketContext } from 'src/socket/SocketContext';

import style from '../index.module.less';

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  RECEIVED_PAID_TOKEN = 'RECEIVED_PAID_TOKEN',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged'
}

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_LEFT = 'private-stream/streamLeft';
const JOINED_THE_ROOM = 'JOINED_THE_ROOM';

interface IProps {
  getStreamConversationSuccess: Function;
  activeConversation: any;
  resetStreamMessage: Function;
  resetStreamConversation: Function;
  updateCurrentPerformerBalance: Function;
}

interface IStates {
  // sessionId: string;
  processing: boolean;
  roomJoined: boolean;
  total?: number;
  receivedToken: number;
  members?: IUser[];
}

class ModelPrivateChat extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static layout = 'stream';

  private readonly localVideoId = 'group-publisher';

  private readonly remoteVideoContainerClassname = 'group-video-container';

  private mainVideoRef;

  private publisherRef;

  private subscriberRef;

  private socket: SocketIOClient.Socket;

  private streamId: string;

  private streamList: Array<string>;

  constructor(props: IProps) {
    super(props);
    this.state = {
      // sessionId: '',
      processing: false,
      roomJoined: false,
      total: 0,
      receivedToken: 0,
      members: []
    };
  }

  componentDidMount() {
    this.publisherRef = React.createRef();
    this.subscriberRef = React.createRef();
  }

  componentDidUpdate(prevProps: IProps) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id && activeConversation !== prevProps.activeConversation) {
      this.initSocketEvent();
    }
  }

  handler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({
        total,
        members
      });
    }
  }

  // use via ref
  // eslint-disable-next-line react/no-unused-class-component-methods
  handleRemoteVideo(event) {
    const { srcObject } = event.target;
    this.mainVideoRef.current.srcObject = srcObject;
    this.mainVideoRef.current.hidden = false;
    this.mainVideoRef.current.play();
  }

  receivedPaidTokenHandler = ({ token, conversationId }) => {
    const { activeConversation, updateCurrentPerformerBalance: dispatchUpdateCurrentPerformerBalance } = this.props;
    const { receivedToken } = this.state;
    if (activeConversation?.data?._id === conversationId) {
      dispatchUpdateCurrentPerformerBalance(token);
      this.setState({
        receivedToken: receivedToken + token
      });
    }
  };

  initSocketEvent() {
    const { getSocket } = this.context as ISocketContext;
    this.socket = getSocket();
    this.socket.on(
      JOINED_THE_ROOM,
      ({ streamId, streamList, conversationId }) => {
        const { activeConversation } = this.props;
        if (conversationId !== activeConversation.data._id) return;

        this.streamId = streamId;
        this.streamList = streamList;
        this.publisherRef.current && this.publisherRef.current.publish(streamId);
        if (streamList.length) {
          this.subscriberRef.current && this.subscriberRef.current.play(streamList);
        }
      }
    );
    this.socket.on(STREAM_JOINED, (data: { streamId: string }) => {
      if (this.streamId !== data.streamId) {
        this.subscriberRef.current && this.subscriberRef.current.play([data.streamId]);
      }
    });
    this.socket.on(STREAM_LEFT, (data: { streamId: string }) => {
      this.streamList = this.streamList.filter((id) => id !== data.streamId);
      if (this.streamId !== data.streamId) {
        this.subscriberRef.current && this.subscriberRef.current.close(data.streamId);
      }
    });
  }

  leaveSession() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage,
      resetStreamConversation: dispatchResetStreamConversation
    } = this.props;
    dispatchResetStreamMessage();

    if (this.socket && activeConversation?.data?._id) {
      this.socket.off(JOINED_THE_ROOM);
      this.socket.off(STREAM_JOINED);
      this.socket.off(STREAM_LEFT);
      this.socket.off(STREAM_EVENT.RECEIVED_PAID_TOKEN);
      this.socket.emit(STREAM_EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
      });
    }
    dispatchResetStreamConversation();
    this.setState({
      processing: false,
      roomJoined: false,
      total: 0,
      receivedToken: 0,
      members: []
    });
  }

  async startConversation() {
    const { getStreamConversationSuccess: dispatchGetStreamConversationSuccess } = this.props;
    try {
      this.setState({ processing: true });
      const resp = await streamService.startGroupChat();
      if (resp && resp.data) {
        const { sessionId, conversation } = resp.data;
        const { getSocket } = this.context as ISocketContext;
        this.socket = getSocket();
        this.publisherRef.current && this.publisherRef.current.start(conversation._id, sessionId);
        dispatchGetStreamConversationSuccess({
          data: conversation
        });
        this.socket
          && this.socket.emit(STREAM_EVENT.JOIN_ROOM, {
            conversationId: resp.data.conversation._id
          });
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ processing: false });
    }
  }

  roomJoinedHandler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({
        roomJoined: true,
        total,
        members
      });
    }
  }

  leave() {
    this.publisherRef.current && this.publisherRef.current.stop();
    this.subscriberRef.current && this.subscriberRef.current.stop();
    this.leaveSession();

    message.info('Streaming stopped. Redirect to homepage in 3 seconds');

    setTimeout(() => {
      window.location.href = '/';
    }, 3 * 1000);
  }

  render() {
    const {
      processing, total, members, roomJoined, receivedToken
    } = this.state;
    return (
      <div className={style['group-chat-model']}>
        <Header>
          <title>Group Chat</title>
        </Header>

        <Event
          event={STREAM_EVENT.STREAM_INFORMATION_CHANGED}
          handler={this.handler.bind(this)}
        />
        <Event
          event={STREAM_EVENT.JOINED_THE_ROOM}
          handler={this.roomJoinedHandler.bind(this)}
        />
        <Event
          event={STREAM_EVENT.RECEIVED_PAID_TOKEN}
          handler={this.receivedPaidTokenHandler.bind(this)}
        />
        <Row>
          <Col md={12} xs={24}>
            <div className={classNames(styles['stream-group-main'], { [styles.streaming_group_show]: roomJoined })}>
              <div className="button-streaming">
                {!roomJoined
                  ? (
                    <Button
                      type="primary"
                      onClick={this.startConversation.bind(this)}
                      loading={processing}
                      block
                    >
                      Start Group chat
                    </Button>
                  )
                  : (
                    <Button
                      type="primary"
                      onClick={this.leave.bind(this)}
                      block
                      disabled={processing}
                    >
                      Stop Streaming
                    </Button>
                  )}
              </div>

              <div style={{ position: 'relative' }} className="stream-group">
                <div id="group-video-container">

                  <div id="main-video">
                    <GroupPublisher
                      {...this.props}
                      containerClassName={this.remoteVideoContainerClassname}
                      ref={this.publisherRef}
                      configs={{
                        localVideoId: this.localVideoId
                      }}
                    />
                  </div>

                  {roomJoined ? (
                    <div id="sub-viewers">
                      <GroupSubscriber
                        {...this.props}
                        ref={this.subscriberRef}
                        containerClassName={this.remoteVideoContainerClassname}
                        configs={{
                          isPlayMode: true
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <Description roomJoined={roomJoined} receivedToken={receivedToken} />
          </Col>
          <Col xs={24} md={12}>
            <ChatBox
              {...this.props}
              totalParticipant={total}
              members={members}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

ModelPrivateChat.contextType = SocketContext;

const mapStateToProps = (state) => ({
  loggedIn: state.auth.loggedIn,
  activeConversation: state.streamMessage.activeConversation,
  ...state.streaming
});

const mapDispatchs = {
  getStreamConversationSuccess,
  resetStreamMessage,
  resetStreamConversation,
  updateCurrentPerformerBalance
};

export default connect(
  mapStateToProps,
  mapDispatchs

)(ModelPrivateChat);
