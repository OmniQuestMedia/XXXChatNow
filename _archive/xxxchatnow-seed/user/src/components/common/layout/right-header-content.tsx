import {
  DollarOutlined,
  HeartOutlined,
  LogoutOutlined,
  MessageOutlined,
  SettingOutlined,
  StarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { FundsIcon } from '@components/common/base/icons';
import DarkModeSwitch from '@components/common/DarkModeSwitch';
import PrivateRequestDropdownMenu from '@components/streaming/private-request-dropdown-menu';
import { roundBalance } from '@lib/utils';
import { logout } from '@redux/auth/actions';
import { countUnreadMessage } from '@redux/message/actions';
import { updateCurrentPerformerBalance, updatePerformerProfile } from '@redux/performer/actions';
import { currentUserSelector } from '@redux/selectors';
import { updateUser } from '@redux/user/actions';
import { messageService } from '@services/message.service';
import {
  Avatar, Button, Dropdown, Menu, message, Tooltip
} from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  useContext, useEffect, useRef
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { SocketContext } from 'src/socket';

const mapStates = (state: any) => ({
  loggedIn: state.auth.loggedIn,
  currentUser: currentUserSelector(state),
  tipSound: state.settings.tipSound || '/sounds/default-audio.mp3',
  totalUnreadMessage: state.message.totalUnreadMessage
});

const mapDispatch = {
  dispatchLogout: logout,
  dispatchUpdateCurrentPerformerBalance: updateCurrentPerformerBalance,
  dispatchCountUnreadMessage: countUnreadMessage,
  dispatchUpdateUser: updateUser,
  dispatchupdatePerformerProfile: updatePerformerProfile
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

const EVENT = {
  RECEIVED_PRIVATE_CHAT_REQUEST: 'private-chat-request',
  NOTIFY_READ_MESSAGE: 'nofify_read_messages_in_conversation',
  TIPPED: 'tipped',
  PURCHASED_ITEM: 'purchase_media_item_success'
};

function RightHeaderContent({
  loggedIn,
  currentUser,
  tipSound,
  totalUnreadMessage,
  dispatchLogout,
  dispatchUpdateCurrentPerformerBalance,
  dispatchCountUnreadMessage,
  dispatchUpdateUser,
  dispatchupdatePerformerProfile
}: PropsFromRedux) {
  const { getSocket, socketStatus, connected } = useContext(SocketContext);
  const router = useRouter();
  const audio = useRef<HTMLAudioElement>(null);

  const handleSwitch = async (checked: boolean) => {
    if (currentUser?._id && currentUser.isPerformer) {
      await dispatchupdatePerformerProfile({ ...currentUser, isDark: checked });
    } else {
      await dispatchUpdateUser({ ...currentUser, isDark: checked });
    }
  };

  const sendTipHandler = ({ senderInfo, netPrice, token }) => {
    message.success(
      `${senderInfo?.displayName || senderInfo.username || 'N/A'} has tipped ${token?.toFixed(2)} tokens. You have received ${netPrice?.toFixed(2)}`,
      10
    );
    dispatchUpdateCurrentPerformerBalance(netPrice);
    audio.current?.play();
  };

  const newPurchasedItem = ({ netPrice }) => {
    message.success('A content has been purchased, please check your orders menu', 10);
    dispatchUpdateCurrentPerformerBalance(netPrice);
    audio.current?.play();
  };

  const handleMessage = ({ total }) => {
    dispatchCountUnreadMessage(total);
  };

  const handleConnect = () => {
    const socket = getSocket();
    if (!socket) return;

    if (currentUser?.role === 'performer') {
      socket.on(EVENT.TIPPED, sendTipHandler);
      socket.on(EVENT.PURCHASED_ITEM, newPurchasedItem);
    }
    socket.on(EVENT.NOTIFY_READ_MESSAGE, handleMessage);
  };

  const handleDisconnect = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off(EVENT.TIPPED, sendTipHandler);
    socket.off(EVENT.PURCHASED_ITEM, newPurchasedItem);
    socket.off(EVENT.NOTIFY_READ_MESSAGE, handleMessage);
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

  const handleCountUnreadMessage = async () => {
    const resp = await messageService.countTotalUnread();
    dispatchCountUnreadMessage(resp.data.total);
  };

  useEffect(() => {
    if (!loggedIn) return;
    handleCountUnreadMessage();
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <Button className="btn-login" onClick={() => router.push('/auth/login/user', '/auth/login/user')}>
        Login
      </Button>
    );
  }

  const getLink = (label, href) => (
    <Link href={href}>
      <a>{label}</a>
    </Link>
  );

  const userDropdownMenuItems = [
    {
      label: getLink('Profile', '/account/user/account-settings'),
      icon: <SettingOutlined className="primary-icon" />,
      key: 'settings'
    },
    {
      label: getLink('My Favorites', '/account/user/favorites'),
      icon: <HeartOutlined className="primary-icon" />,
      key: 'favorite'
    },
    {
      label: getLink('Funds / Tokens', '/account/user/funds-tokens'),
      icon: <span className="anticon primary-icon"><FundsIcon /></span>,
      key: 'funds'
    },
    {
      label: getLink(`Messages (${totalUnreadMessage || 0})`, '/messages'),
      icon: <MessageOutlined className="primary-icon" />,
      key: 'message'
    },
    {
      label: getLink('Community Chat', '/community-chat'),
      icon: <MessageOutlined className="primary-icon" />,
      key: 'user_community_chat'
    }
  ];

  const performerDropdownMenuItems = [
    {
      label: getLink('Profile', '/account/performer/profile'),
      icon: <UserOutlined className="primary-icon" />,
      key: 'profile'
    },
    {
      label: getLink('Account Settings', '/account/performer/account-settings'),
      icon: <SettingOutlined className="primary-icon" />,
      key: 'account-settings'
    },
    {
      label: getLink(`Messages (${totalUnreadMessage || 0})`, '/messages'),
      icon: <MessageOutlined className="primary-icon" />,
      key: 'message'
    },
    {
      label: getLink('Community Chat', '/community-chat'),
      icon: <MessageOutlined className="primary-icon" />,
      key: 'model_community_chat'
    },
    {
      label: getLink('Crowdfunding', '/account/performer/crowdfunding'),
      icon: <DollarOutlined className="primary-icon" />,
      key: 'crowdfunding'
    },
    {
      label: getLink('Featured creators', '/account/performer/featured-creators'),
      icon: <StarOutlined className="primary-icon" />,
      key: 'featured-creators'
    }
  ];

  const studioDropdownMenuItems = [
    {
      label: getLink('Account Settings', '/studio/account-settings'),
      icon: <SettingOutlined className="primary-icon" />,
      key: 'account-settings'
    }
  ];

  let dropDownMenuItems = [];
  let balanceHref = '#';
  switch (currentUser?.role) {
    case 'user':
      dropDownMenuItems = userDropdownMenuItems;
      balanceHref = '/account/user/funds-tokens';
      break;
    case 'performer':
      dropDownMenuItems = performerDropdownMenuItems;
      balanceHref = '/account/performer/payout-requests';
      break;
    case 'studio':
      dropDownMenuItems = studioDropdownMenuItems;
      balanceHref = '/studio/payout-requests';
      break;
    default: break;
  }
  dropDownMenuItems.push({
    label: <span role="button" onClick={dispatchLogout} tabIndex={0}>Log out</span>,
    icon: <LogoutOutlined className="primary-icon" />,
    key: 'logout'
  });

  return (
    <>
      <Link href={balanceHref}>
        <a>
          <Tooltip title={`${(currentUser.balance && currentUser.balance.toFixed(2)) || 0} Tokens`}>
            <Button className="btn-tokens">
              {`${roundBalance(currentUser?.balance || 0)} Tokens`}
            </Button>
          </Tooltip>
        </a>
      </Link>
      {currentUser.role === 'performer' && <PrivateRequestDropdownMenu />}
      <Dropdown overlay={<Menu key="menu-right-content" items={dropDownMenuItems} />}>
        <Avatar
          style={{
            margin: '0 10px',
            cursor: 'pointer',
            background: '#ffffff',
            minWidth: '32px'
          }}
          src={currentUser?.avatar || '/default-user-icon.png'}
        />
      </Dropdown>
      <DarkModeSwitch isDarkMode={currentUser?.isDark} onSwitchChange={handleSwitch} />
    </>
  );
}

export default connector(RightHeaderContent);
