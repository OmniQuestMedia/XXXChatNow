import LiveSubscriber from '@components/streaming/subscriber';
import { getResponseError, redirect } from '@lib/utils';
import {
  getStreamConversationSuccess,
  resetStreamConversation,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Button, Col, List, message,
  Row
} from 'antd';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Router from 'next/router';
import nextCookie from 'next-cookies';
import { useContext, useRef, useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';
import { HLS, IPerformer, WEBRTC } from 'src/interfaces';
import { streamService } from 'src/services';
import { SocketContext } from 'src/socket';

const ListItem = dynamic(() => import('@components/common/base/list-item'));

// eslint-disable-next-line no-shadow
enum EVENT {
  PEEK_IN = 'PEEK_IN'
}

const mapStateToProps = (state) => ({
  user: state.user.current,
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
  _id: string;
  performerInfo: IPerformer;
  token: number;
  timeLimit: number;
};

function UserPeekInPrivateChat({
  _id,
  performerInfo,
  token,
  timeLimit,
  dispatchUpdateBalance
}: Props & PropsFromRedux) {
  const [submitted, setSubmitted] = useState(false);
  const subscriberRef = useRef<any>(null);
  const { getSocket } = useContext(SocketContext);
  const streamSettings = useSelector((state: any) => state.streaming.settings);

  const peekIn = async () => {
    try {
      const resp = await streamService.payPeekIn(_id);
      setSubmitted(true);
      dispatchUpdateBalance(-token);

      const socket = getSocket();
      socket.emit(
        EVENT.PEEK_IN,
        {
          id: resp.data.targetId
        },
        ({ streamId }) => {
          if (!streamId) return;
          if (streamSettings?.optionForBroadcast === HLS) {
            subscriberRef.current?.playHLS(streamId);
          } else if (streamSettings?.optionForBroadcast === WEBRTC) {
            subscriberRef.current?.play(streamId);
          }

          setTimeout(() => {
            message.error('Timeout!');
            window.location.href = '/';
          }, timeLimit * 1000);
        }
      );
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  return (
    <>
      <Head>
        <title>Private Chat</title>
      </Head>
      <div>
        <Row>
          <Col xs={24} sm={6} md={6}>
            <h1>
              Peek Ins with
              {' '}
              {performerInfo?.username}
            </h1>
            <List
              dataSource={[
                {
                  title: 'Token',
                  description: `${token} token(s)` || 'N/A'
                },
                {
                  title: 'Time limit',
                  description: `${timeLimit} second(s)` || 'N/A'
                }
              ]}
              renderItem={(item) => (
                <ListItem description={item.description} title={item.title} />
              )}
            />
          </Col>
          <Col xs={24} sm={18} md={18}>
            <Button onClick={peekIn} type="primary" hidden={submitted} block>
              Start
            </Button>
            <Button style={{ background: '#000', color: '#fff' }} onClick={() => Router.push('/')} type="default" hidden={!submitted} block>
              Stop peek-ins
            </Button>
            <div id="peekin-video">
              <LiveSubscriber
                ref={subscriberRef}
                configs={{
                  isPlayMode: true,
                  debug: process.env.DEBUG
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}

UserPeekInPrivateChat.authenticate = true;

UserPeekInPrivateChat.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const { token } = nextCookie(ctx);
    const headers = { Authorization: token };
    const resp = await streamService.getPeekIn(query.id, headers);

    return {
      ...resp.data
    };
  } catch (e) {
    redirect('/', ctx);
    return {};
  }
};

export default connector(UserPeekInPrivateChat);
