import {
  CalendarOutlined,
  EyeOutlined,
  // EyeOutlined,
  HeartFilled,
  HeartOutlined,
  MailOutlined
} from '@ant-design/icons';
import { GiftIcon } from '@components/common/base/icons';
import { currentUserSelector } from '@redux/selectors';
import {
  Button, Col, message,
  Row
} from 'antd';
import Router from 'next/router';
import React from 'react';
import { useSelector } from 'react-redux';
import { IPerformer, IUIConfig, IUser } from 'src/interfaces';
import { defaultColor } from 'src/lib';
import { checkUserLogin, getResponseError } from 'src/lib/utils';
import {
  favouriteService,
  streamService
  // streamService
} from 'src/services';

import style from './header.module.less';

interface P {
  performer: IPerformer;
}

export function StreamingHeader({ performer }: P) {
  const { _id, username } = performer;

  const user = useSelector((state) => currentUserSelector(state)) as IUser;
  const ui = useSelector((state: any) => state.ui) as IUIConfig;
  const loggedIn: boolean = useSelector((state: any) => state.auth.loggedIn);

  const [isFavorite, setIsFavorite] = React.useState(
    performer.isFavorite || false
  );

  const handleError = async (e) => {
    const error = await Promise.resolve(e);
    message.error(getResponseError(error));
  };

  const onLike = async () => {
    if (!checkUserLogin(loggedIn, user)) {
      message.error('Please login to add favorite!');
      return;
    }

    try {
      await favouriteService.favorite(_id, isFavorite);
      setIsFavorite(!isFavorite);
    } catch (e) {
      handleError(e);
    }
  };

  const sendGift = () => {
    if (!checkUserLogin(loggedIn, user)) {
      message.error(`Please login to send gift to ${username}!`);
    }
  };

  const notify = () => {
    if (!checkUserLogin(loggedIn, user)) {
      message.error(`Please login to notify ${username}!`);
    }
  };

  const sendMessage = () => {
    if (!checkUserLogin(loggedIn, user)) {
      Router.push('/auth/login/user');
      return;
    }

    Router.push({
      pathname: '/messages',
      query: {
        toSource: 'performer',
        toId: _id || ''
      }
    });
  };

  const peekIn = async () => {
    if (!checkUserLogin(loggedIn, user)) {
      message.error(`Please login to peek in ${username} private chat!`);
      return;
    }

    try {
      const resp = await streamService.peekIn(performer._id);
      Router.push(`/stream/peek-in/${resp.data._id}`);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  const onViewPerformerScheduled = () => {
    if (!checkUserLogin(loggedIn, user)) {
      Router.push('/auth/login/user');
      return;
    }

    Router.push({
      pathname: '/scheduled-premium-live',
      query: {
        username: performer.username
      }
    });
  };

  return (
    <Row className={style['stream-header']}>
      <Col sm={12} xs={24} className={style['stream-header-left']}>
        <div className={style['left-content']}>
          <img
            src={performer.avatar || ui?.placeholderAvatarUrl || '/user.png'}
            alt=""
            className={style['stream-avatar']}
          />
          {' '}
          <div className={style['stream-title']}>
            <span>{performer.username}</span>
            {performer.streamingTitle && (
              <span>{performer.streamingTitle}</span>
            )}
          </div>
        </div>
        {/* <span>Report abuse</span> */}
      </Col>
      <Col sm={12} xs={24} className={style['stream-header-right']}>
        <div className={style['button-block']}>
          {performer.streamingStatus === 'private' && performer.enablePeekIn && (
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={peekIn}
            >
              Peek Ins
            </Button>
          )}
          <Button
            type="primary"
            hidden
            icon={<GiftIcon />}
            onClick={() => sendGift()}
          >
            Send Gift
          </Button>
          <Button
            type="default"
            hidden
            icon={<HeartOutlined />}
            onClick={() => notify()}
          >
            Notify me
          </Button>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => sendMessage()}
          >
            <span>Send message</span>
          </Button>
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => onViewPerformerScheduled()}
          >
            <span>Scheduled Premium Live</span>
          </Button>
          <Button
            type="default"
            onClick={() => onLike()}
            icon={
              isFavorite ? (
                <HeartFilled style={{ color: defaultColor.primaryColor }} />
              ) : (
                <HeartOutlined
                  style={{ color: defaultColor.primaryColor }}
                />
              )
            }
          >
            <span>{isFavorite ? 'Unlike' : 'Like'}</span>
          </Button>
        </div>
      </Col>
    </Row>
  );
}

export default StreamingHeader;
