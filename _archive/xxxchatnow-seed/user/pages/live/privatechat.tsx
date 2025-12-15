import ChatBox from '@components/stream-chat/chat-box';
import { Description } from '@components/streaming';
import PrivateChatContainer from '@components/streaming/private-streaming-container';
import PreviewPlayer from '@components/streaming/subscriber';
import { getResponseError } from '@lib/utils';
import { updateCurrentPerformerBalance } from '@redux/performer/actions';
import {
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import {
  Col, message, Row
} from 'antd';
import Header from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { IUser } from 'src/interfaces';
import { accessPrivateRequest } from 'src/redux/streaming/actions';
import { messageService, streamService } from 'src/services';
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
  query: any;
  getStreamConversationSuccess: Function;
  activeConversation: any;
  resetStreamMessage: Function;
  accessPrivateRequest: Function;
  resetStreamConversation: Function;
  updateCurrentPerformerBalance: Function;
}

interface IStates {
  total?: number;
  members?: IUser[];
  roomJoined: boolean;
  receivedToken: number;
  requestUser: IUser;
  acceptedRequest: boolean;
}

class ModelPrivateChat extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static layout = 'stream';

  private streamRef: any;

  private previewPlayerRef;

  private socket: SocketIOClient.Socket;

  static async getInitialProps(ctx) {
    const { query } = ctx;
    if (!query.id) {
      if (typeof window !== 'undefined') {
        Router.push('/');
      }

      ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/' });
      ctx.res.end && ctx.res.end();
    }

    return {
      query
    };
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      roomJoined: false,
      total: 0,
      receivedToken: 0,
      members: [],
      requestUser: null,
      acceptedRequest: false
    };
  }

  componentDidMount() {
    const { query, accessPrivateRequest: dispatchAccessPrivateRequest } = this.props;
    window.addEventListener('beforeunload', this.onbeforeunload);
    Router.events.on('routeChangeStart', this.onbeforeunload);
    dispatchAccessPrivateRequest(query.id);
    this.getConversationDetail();
  }

  componentDidUpdate(prevProps: IProps) {
    const {
      activeConversation,
      query,
      accessPrivateRequest: dispatchAccessPrivateRequest
    } = this.props;
    if (prevProps.query.id !== query.id) {
      dispatchAccessPrivateRequest(query.id);
      this.previewPlayerRef && this.previewPlayerRef.destroyPlaybackVideo();
      this.getConversationDetail();
    }

    if (prevProps.activeConversation !== activeConversation) {
      prevProps.activeConversation?._id
        && this.socket.emit(STREAM_EVENT.LEAVE_ROOM, {
          conversationId: prevProps.activeConversation._id
        });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    Router.events.off('routeChangeStart', this.onbeforeunload);
  }

  handler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({ total, members });
    }
  }

  onbeforeunload = () => {
    this.leaveSession();
  };

  async getConversationDetail() {
    const { query } = this.props;
    const conversation = await messageService.getConversationDetail(query.id);
    this.setState({
      requestUser: conversation.data.recipientInfo
    });
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

  leaveSession() {
    const {
      activeConversation,
      resetStreamMessage: dispatchResetStreamMessage,
      resetStreamConversation: dispatchResetStreamConversation
    } = this.props;
    if (this.socket && activeConversation?.data?._id) {
      this.socket.emit(STREAM_EVENT.LEAVE_ROOM, {
        conversationId: activeConversation.data._id
      });
      this.socket.off(STREAM_EVENT.RECEIVED_PAID_TOKEN);
    }
    dispatchResetStreamMessage();
    dispatchResetStreamConversation();
    this.setState({
      roomJoined: false,
      total: 0,
      receivedToken: 0,
      members: []
    });
  }

  async acceptRequest() {
    const {
      query,
      getStreamConversationSuccess: dispatchGetStreamConversationSuccess
    } = this.props;
    if (!query.id) return;

    try {
      this.previewPlayerRef && this.previewPlayerRef.destroyPlaybackVideo();
      this.setState({ acceptedRequest: true });
      const resp = await streamService.acceptPrivateChat(query.id);
      if (resp && resp.data) {
        const { getSocket } = this.context as ISocketContext;
        this.socket = getSocket();
        const { sessionId, conversation } = resp.data;
        this.socket
          && this.socket.emit(STREAM_EVENT.JOIN_ROOM, {
            conversationId: conversation._id
          });
        this.streamRef && this.streamRef.start(sessionId, conversation._id);
        dispatchGetStreamConversationSuccess({
          data: conversation
        });
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  roomJoinedHandler({ total, members, conversationId }) {
    const { activeConversation } = this.props;
    if (activeConversation?.data?._id === conversationId) {
      this.setState({
        total,
        members,
        roomJoined: true
      });
    }
  }

  render() {
    const {
      total, members, roomJoined, receivedToken, requestUser, acceptedRequest
    } = this.state;

    return (
      <>
        <Header>
          <title>Private Chat</title>
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

        <div className={style['model-stream-private']}>
          <Row>
            <Col md={12} xs={24}>
              <Description
                roomJoined={roomJoined}
                receivedToken={receivedToken}
              />
              {requestUser && !acceptedRequest
              && (
              <div className="txt-show-chat">
                <PreviewPlayer
                  ref={(ref) => {
                    this.previewPlayerRef = ref;
                  }}
                  configs={{
                    isPlayMode: true
                  }}
                />
                <div>
                  <span className="username">
                    <img
                      alt="avatar"
                      src={requestUser?.avatar || '/default-user-icon.png'}
                    />
                  </span>
                  <p>
                    <span>{requestUser.username}</span>
                    <br />
                    Requested private streaming
                  </p>
                </div>
              </div>
              )}
              <PrivateChatContainer
                ref={(ref) => {
                  this.streamRef = ref;
                }}
                configs={{
                  localVideoId: 'private-publisher'
                }}
                onClick={this.acceptRequest.bind(this)}
              />
              {/* <Button
              block
              type="text"
              hidden={roomJoined}
              style={{ background: 'black', color: 'white', margin: '10px 0' }}
              onClick={this.preview.bind(this)}
            >
              Preview
            </Button> */}

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
      </>
    );
  }
}

ModelPrivateChat.contextType = SocketContext;

const mapStateToProps = (state) => ({
  activeConversation: state.streamMessage.activeConversation,
  currentPerformer: state.performer.current
});

const mapDispatchs = {
  accessPrivateRequest,
  getStreamConversationSuccess,
  resetStreamMessage,
  resetStreamConversation,
  updateCurrentPerformerBalance
};
export default connect(mapStateToProps, mapDispatchs)(ModelPrivateChat);
