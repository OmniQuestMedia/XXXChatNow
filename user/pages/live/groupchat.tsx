import ChatBox from '@components/stream-chat/chat-box';
import { Description } from '@components/streaming';
import GroupChatContainer from '@components/streaming/group-streaming-container';
import { getResponseError } from '@lib/utils';
import { updateCurrentPerformerBalance } from '@redux/performer/actions';
import {
  getStreamConversation,
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { Col, message, Row } from 'antd';
import Header from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IUser } from 'src/interfaces';
import { streamService } from 'src/services';
import { Event, SocketContext } from 'src/socket';
import { ISocketContext } from 'src/socket/SocketContext';

import style from './index.module.less';

// eslint-disable-next-line no-shadow
enum STREAM_EVENT {
  JOINED_THE_ROOM = 'JOINED_THE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  LEAVE_ROOM = 'LEAVE_ROOM',
  RECEIVED_PAID_TOKEN = 'RECEIVED_PAID_TOKEN',
  STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged'
}

interface IProps {
  user: IPerformer;
  activeConversation: any;
  resetStreamMessage: Function;
  getStreamConversation: Function;
  resetStreamConversation: Function;
  updateCurrentPerformerBalance: Function;
  getStreamConversationSuccess: Function;
}

interface IStates {
  total?: number;
  members?: IUser[];
  roomJoined: boolean;
  receivedToken: number;
}

class PerformerGroupChat extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static layout = 'stream';

  private streamRef: any;

  private socket: SocketIOClient.Socket;

  constructor(props: IProps) {
    super(props);
    this.state = {
      roomJoined: false,
      total: 0,
      receivedToken: 0,
      members: []
    };
  }

  componentDidMount() {
    const { getSocket } = this.context as ISocketContext;
    this.socket = getSocket();
    window.addEventListener('beforeunload', this.onbeforeunload);
    Router.events.on('routeChangeStart', this.onbeforeunload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    Router.events.off('routeChangeStart', this.onbeforeunload);
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

  onbeforeunload = () => {
    this.leaveSession();
  };

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

  leaveSession() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage,
      resetStreamConversation: dispatchResetStreamConversation
    } = this.props;
    if (activeConversation?.data?._id) {
      this.socket && this.socket.emit(STREAM_EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
      });
      this.socket && this.socket.off(STREAM_EVENT.RECEIVED_PAID_TOKEN);
      dispatchResetStreamMessage();
      dispatchResetStreamConversation();
    }
    this.setState({
      roomJoined: false,
      total: 0,
      receivedToken: 0,
      members: []
    });
  }

  async startConversation() {
    const {
      getStreamConversation: dispatchGetStreamConversation,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess
    } = this.props;
    try {
      const resp = await streamService.startGroupChat();
      if (resp && resp.data) {
        const { getSocket } = this.context as ISocketContext;
        this.socket = getSocket();
        this.streamRef
          && this.streamRef.start(resp.data.sessionId, resp.data.conversation._id);
        dispatchGetStreamConversationSuccess({
          data: resp.data.conversation
        });
        dispatchGetStreamConversation({
          conversation: resp.data.conversation
        });
        this.socket
          && this.socket.emit(STREAM_EVENT.JOIN_ROOM, {
            conversationId: resp.data.conversation._id
          });
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  roomJoinedHandler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (
      activeConversation?.data?._id === conversationId) {
      this.setState({
        total,
        members,
        roomJoined: true
      });
    }
  }

  render() {
    const {
      total,
      members,
      roomJoined,
      receivedToken
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
        {/* <div className="group-no-chat" /> */}
        <Row>
          <Col md={12} xs={24}>
            <div className="box-video-group">
              <GroupChatContainer
                ref={(ref) => { this.streamRef = ref; }}
                configs={{ localVideoId: 'localVideoId' }}
                onClick={this.startConversation.bind(this)}
              />

              {!roomJoined ? (
                <> </>
              )
                : (
                  <Description
                    roomJoined={roomJoined}
                    receivedToken={receivedToken}
                  />
                )}
            </div>
          </Col>
          <Col md={12} xs={24}>
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

PerformerGroupChat.contextType = SocketContext;

const mapStateToProps = (state) => ({
  user: state.user.current,
  loggedIn: state.auth.loggedIn,
  activeConversation: state.streamMessage.activeConversation
});
const mapDispatchs = {
  getStreamConversation,
  resetStreamMessage,
  resetStreamConversation,
  updateCurrentPerformerBalance,
  getStreamConversationSuccess
};
export default connect(mapStateToProps, mapDispatchs)(PerformerGroupChat);
