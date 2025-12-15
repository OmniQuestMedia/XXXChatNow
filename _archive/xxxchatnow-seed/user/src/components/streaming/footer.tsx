/* eslint-disable react/require-default-props */
/* eslint-disable no-return-assign */
import {
  CrownOutlined,
  UserOutlined
} from '@ant-design/icons';
import { checkUserLogin } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import { updateUIValue } from '@redux/ui/actions';
import {
  Button, Col,
  message,
  Row
} from 'antd';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  connect, ConnectedProps, useDispatch, useSelector
} from 'react-redux';
import { SETTING_KEYS } from 'src/constants';
import { IPerformer, IUser, StreamSettings } from 'src/interfaces';

import style from './footer.module.less';
import SendTipBtn from './tip/send-tip-btn';

const btnStyle = { height: 50, marginBottom: 1 };

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface Interface {
  performer: IPerformer;
  inGroupChat?: boolean;
  inPrivateChat?: boolean;
  settings: StreamSettings;
  onTabChange?: Function;
  activeTab?: string;
  totalParticipant?: number;
}

function Footer({
  performer,
  inGroupChat = false,
  inPrivateChat = false,
  onTabChange = () => { },
  activeTab = 'chat',
  settings,
  totalParticipant = 0,
  singularTextModel = 'Performer'
}: Interface & PropsFromRedux) {
  const [tab, setActiveTab] = useState(activeTab);
  const { username } = performer;
  const user = useSelector((state) => currentUserSelector(state)) as IUser;
  const loggedIn: boolean = useSelector((state: any) => state.auth.loggedIn);
  const dispatch = useDispatch();

  const goChatRoom = (roomName: 'privatechat' | 'groupchat', query = {} as any) => {
    if (!checkUserLogin(loggedIn, user)) {
      Router.push('/auth/login/user');
      return;
    }
    const option = roomName === 'privatechat' ? SETTING_KEYS.OPTION_FOR_PRIVATE : SETTING_KEYS.OPTION_FOR_GROUP;
    const pathname = settings[option] === 'webrtc' ? `/stream/${roomName}/webrtc/[username]` : `/stream/${roomName}/[username]`;
    const pathAs = settings[option] === 'webrtc' ? `/stream/${roomName}/webrtc/${username}` : `/stream/${roomName}/${username}`;

    Router.push(
      {
        pathname,
        query: {
          username,
          performer: JSON.stringify(performer),
          ...query
        }
      },
      pathAs
    );
  };

  const getMoreTokens = () => {
    if (!checkUserLogin(loggedIn, user)) {
      Router.push('/auth/login/user');
      return;
    }

    Router.push('/account/user/funds-tokens');
  };

  const changeTab = (t) => {
    if (t === 'bio') {
      dispatch(updateUIValue({ hideBio: false }));
    } else {
      dispatch(updateUIValue({ hideBio: true }));
    }
    setActiveTab(t);
    onTabChange(t);
  };

  useEffect(() => {
    setActiveTab(tab);
  }, [activeTab]);

  useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        dispatch(updateUIValue({ hideBio: true }));
      }, 100);
    }
  }, []);

  return (
    <div className={style['stream-footer']}>
      <Row gutter={[1, 1]} style={{ marginBottom: '15px', marginTop: '1px' }} className={style['stream-footer-desktop']}>
        {performer.verified ? (
          <>
            <Col lg={6} xs={12} md={12}>
              <Button
                disabled={inGroupChat}
                type="primary"
                style={{ ...btnStyle }}
                onClick={() => goChatRoom('groupchat')}
                block
                icon={(
                  <img
                    className="anticon"
                    src="/icons/group.svg"
                    height={16}
                    alt=""
                  />
                )}
              >
                Group Chat
              </Button>
            </Col>
            <Col lg={6} xs={12} md={12}>
              <Button
                disabled={inPrivateChat}
                type="primary"
                style={{ ...btnStyle }}
                onClick={() => {
                  if (performer.streamingStatus === 'private') {
                    message.error(`${singularTextModel} is streaming private, please connect after some time`);
                    return;
                  }
                  goChatRoom('privatechat');
                }}
                block
                icon={<UserOutlined />}
              >
                Private Chat
              </Button>
            </Col>
            <Col lg={6} xs={12} md={12}>
              <Button
                type="primary"
                style={{ ...btnStyle }}
                block
                onClick={() => getMoreTokens()}
                icon={<CrownOutlined />}
              >
                Top-up My Tokens
              </Button>
            </Col>
            <Col lg={6} xs={12} md={12}>
              <SendTipBtn performer={performer} />
            </Col>
          </>
        ) : (
          <Col xs={12} md={12}>
            <Button
              type="primary"
              style={{ ...btnStyle }}
              block
              onClick={() => getMoreTokens()}
              icon={<CrownOutlined />}
            >
              Top-up My Tokens
            </Button>
          </Col>
        )}
      </Row>
      <div className={style['stream-footer-mobile']}>
        {performer.verified ? (
          <div className="stream-footer-mobile-btn">
            <Button
              disabled={inGroupChat}
              type="primary"
              onClick={() => goChatRoom('groupchat')}
            >
              Group Chat
            </Button>
            <Button
              disabled={inPrivateChat}
              type="primary"
              onClick={() => {
                if (performer.streamingStatus === 'private') {
                  message.error(`${singularTextModel} is streaming private, please connect after some time`);
                  return;
                }
                goChatRoom('privatechat', { autoRequest: 1 });
              }}
            >
              Private Chat
            </Button>
          </div>
        ) : (
          <> </>
        )}
        <ul>
          <li className={tab === 'chat' ? 'active' : ''}>
            <button type="button" onClick={() => changeTab('chat')}>Chat</button>
          </li>
          <li className={tab === 'user' ? 'active' : ''}>
            <button type="button" onClick={() => changeTab('user')}>{`User (${totalParticipant || 0})`}</button>
          </li>
          <li className={tab === 'bio' ? 'active' : ''}>
            <button type="button" onClick={() => changeTab('bio')}>Bio</button>
          </li>
        </ul>
      </div>
    </div>
  );
}
Footer.updateCurrentUserBalance = null;

export default connector(Footer);
