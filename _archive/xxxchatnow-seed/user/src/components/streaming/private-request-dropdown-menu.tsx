import {
  BellOutlined
} from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { roundBalance } from '@lib/utils';
import { addPrivateRequest } from '@redux/streaming/actions';
import {
  Avatar, Badge, Card, Dropdown, Menu, message
} from 'antd';
import { useRouter } from 'next/router';
import { useContext, useEffect, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { SETTING_KEYS } from 'src/constants';
import { IUser } from 'src/interfaces';
import { SocketContext } from 'src/socket';

import style from './private-request-dropdown.module.less';

const mapStates = (state: any) => ({
  privateRequests: state.streaming.privateRequests,
  streamSettings: state.streaming.settings,
  tipSound: state.settings.tipSound || '/sounds/default-audio.mp3'
});

const mapDispatch = {
  dispatchAddPrivateRequest: addPrivateRequest
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

const EVENT = {
  RECEIVED_PRIVATE_CHAT_REQUEST: 'private-chat-request'
};

function PrivateRequestDropdownMenu({
  privateRequests = [],
  streamSettings,
  dispatchAddPrivateRequest,
  tipSound
}: PropsFromRedux) {
  const router = useRouter();
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const audio = useRef<HTMLAudioElement>(null);

  const path = streamSettings[SETTING_KEYS.OPTION_FOR_PRIVATE] === 'webrtc' ? 'webrtc/' : '';

  const handlePrivateChat = (data: {
    conversationId: string;
    user: IUser;
    id: string;
  }) => {
    message.success({
      content: (
        <span style={{ cursor: 'pointer' }}>
          {data?.user?.displayName || data.user.username || 'N/A'}
          {' '}
          sent you a private chat request.
        </span>
      ),
      duration: 10,
      key: data.conversationId,
      onClick: () => {
        router.push(
          {
            pathname: `/live/${path}privatechat`,
            query: {
              id: data.conversationId,
              streamId: data.id
            }
          },
          `/live/${path}privatechat/${data.conversationId}`
        );
        message.destroy(data.conversationId);
      }
    });
    audio.current?.play();
    dispatchAddPrivateRequest({ ...data, createdAt: new Date() });
  };

  const handleConnect = () => {
    const socket = getSocket();
    socket.on(EVENT.RECEIVED_PRIVATE_CHAT_REQUEST, handlePrivateChat);
  };

  const handleDisconnect = () => {
    const socket = getSocket();
    if (socket) {
      socket.off(EVENT.RECEIVED_PRIVATE_CHAT_REQUEST, handlePrivateChat);
    }
  };

  useEffect(() => {
    audio.current = new Audio(tipSound);
    audio.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!connected()) return handleDisconnect();

    handleConnect();

    return handleDisconnect;
  }, [socketStatus]);

  const dropdownItems = privateRequests?.length ? privateRequests.map((request) => ({
    label:
    <Card bordered={false} hoverable={false}>
      <Card.Meta
        avatar={(
          <Avatar
            src={
              request.user?.avatar
              || '/default-user-icon.png'
            }
          />
        )}
        title={`${request?.user?.displayName || request.user?.username || 'N/A'} (${roundBalance(request.user?.balance || 0)} token(s))`}
        description={formatDate(request?.createdAt)}
      />
    </Card>,
    key: request.id,
    request
  })) : [{
    label: 'There are no private request.'
  }];

  const onClick = ({ item }) => {
    const { request = null } = item.props;

    if (!request) return;

    router.push({
      href: `/live/${path}privatechat/${request.conversationId}?streamId=${request.id}`,
      query: {
        id: request.conversationId,
        streamId: request.id
      },
      pathname: `/live/${path}privatechat`
    });
  };

  return (
    <Dropdown
      overlay={(
        <Menu
          items={dropdownItems}
          onClick={onClick}
        />
      )}
    >
      <span className={style['call-requests']}>
        <Badge count={privateRequests.length} showZero>
          <BellOutlined style={{ color: '#ffffff' }} />
        </Badge>
      </span>
    </Dropdown>
  );
}

export default connector(PrivateRequestDropdownMenu);
