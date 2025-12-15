/* eslint-disable react/jsx-no-useless-fragment */
import {
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  LockOutlined
} from '@ant-design/icons';
import {
  FemaleSignIcon,
  MaleSignIcon,
  TransgenderIcon
} from '@components/common/base/icons';
import AntMediaPlayer from '@components/streaming/ant-media-player';
import { getResponseError } from '@lib/utils';
import { updatePerformerFavourite } from '@redux/performer/actions';
import { currentUserSelector } from '@redux/selectors';
import { favouriteService } from '@services/favourite.service';
import { streamService } from '@services/stream.service';
import {
  Card, Col,
  message,
  Row, Space
} from 'antd';
import classnames from 'classnames';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';
import { GENDER, IPerformer } from 'src/interfaces';

const renderTitle = (gender: GENDER, name: string) => (
  <div className="p-title">
    <span style={{ marginRight: 5 }}>{name}</span>
    {gender === 'male' ? (
      <span className="anticon">
        <MaleSignIcon />
      </span>
    ) : gender === 'female' ? (
      <span className="anticon">
        <FemaleSignIcon />
      </span>
    ) : (
      <span className="anticon">
        <TransgenderIcon />
      </span>
    )}
  </div>
);

const renderTags = (tags: string[]) => (
  <Space className="tags" wrap size={[5, 2]}>
    {tags.map((tag) => (
      <Link
        href={{ pathname: '/tag', query: { tags: tag } }}
        key={tag}
        as={`/tag/${tag}`}
      >
        <a>
          #
          {tag}
        </a>
      </Link>
    ))}
  </Space>
);

type IGridCard = {
  performer: IPerformer;
  className?: string;
  placeholderAvatarUrl: string;
}

const mapStates = (state: any) => ({
  loggedIn: state.auth.loggedIn,
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl,
  currentUser: currentUserSelector(state)
});

const mapDispatches = {
  dispatchUpdatePerformerFavorite: updatePerformerFavourite
};

const connector = connect(mapStates, mapDispatches);

type PropsFromRedux = ConnectedProps<typeof connector>;

function GridCard({
  performer,
  loggedIn,
  className = 'performer-box',
  placeholderAvatarUrl = '/default-user-icon.png',
  dispatchUpdatePerformerFavorite,
  currentUser
}: IGridCard & PropsFromRedux) {
  const [hovered, setHover] = useState(false);
  const videoRef = useRef(null);
  const timeout = useRef<any>();
  const enableInteractiveThumbnails = useSelector((state: any) => state.settings.enableInteractiveThumbnails);

  const onLike = async () => {
    const { _id, isFavorite } = performer;
    try {
      await favouriteService.favorite(_id, isFavorite);
      dispatchUpdatePerformerFavorite(_id);
    } catch (error) {
      const e = await Promise.resolve(error);
      message.error(getResponseError(e));
    }
  };

  const { isOnline, streamingStatus } = performer;
  const statusClassNames = ['p-status'];
  let status = 'offline';
  if (isOnline) {
    switch (streamingStatus) {
      case 'private':
        statusClassNames.push('private');
        status = 'private chat';
        break;
      case 'group':
        statusClassNames.push('group');
        status = 'group chat';
        break;
      case 'public':
        status = 'live';
        statusClassNames.push('online');
        break;
      default:
        status = 'online';
        statusClassNames.push('online');
        break;
    }
  } else {
    statusClassNames.push('offline');
  }

  const getStream = async () => {
    const resp = await streamService.getPublicStream(performer._id);
    return resp.data._id;
  };

  const onHover = async () => {
    if (hovered) return;

    timeout.current = setTimeout(async () => {
      try {
        setHover(true);
        const streamId = await getStream();
        streamId && videoRef && videoRef.current && videoRef.current.playHLS(streamId);
      } catch {
        // log
      }
    }, 1000);
  };

  const onLeave = () => {
    clearTimeout(timeout.current);
    timeout.current = null;
    setHover(false);
    videoRef.current && videoRef.current.resetPlaybackVideo();
  };

  return (
    <Card.Grid
      className={className}
      key={performer._id}
      hoverable={false}
      onMouseEnter={() => enableInteractiveThumbnails && onHover()}
      onMouseLeave={() => onLeave()}
    >
      {performer.isBlocked && (
        <div className="blocked-thumb">
          <LockOutlined />
        </div>
      )}
      <Link
        href={{
          pathname: '/profile/[username]',
          query: { performer: JSON.stringify(performer) }
        }}
        as={`/profile/${performer.username}`}
      >
        <a aria-hidden onClick={(e) => currentUser?.isPerformer && e.preventDefault()}>
          <div
            className="performer-avatar"
            style={{
              backgroundImage: `url(${typeof performer.avatar === 'string'
                && performer.avatar.length > 0
                ? performer.avatar
                : placeholderAvatarUrl})`
            }}
          >
            <img
              className="image-performer"
              src={
                typeof performer.avatar === 'string'
                  && performer.avatar.length > 0
                  ? performer.avatar
                  : placeholderAvatarUrl
              }
              alt=""
            />
            <AntMediaPlayer
              ref={videoRef}
              configs={{

              }}
              classNames={classnames('performer-stream-interactive', hovered ? 'show' : '')}
            />
            <span className={statusClassNames.join(' ')}>{status}</span>
            {performer.isFeaturedCreator && <span className="featured-card">VIP</span>}
            {renderTitle(performer.gender, performer.username)}
            {performer?.stats?.views > 0 && (
              <div className="p-viewer">
                <EyeOutlined style={{ marginRight: 5 }} />
                <span>{performer.stats.views}</span>
              </div>
            )}
          </div>
        </a>
      </Link>
      <div className="performer-bottom">
        <Row justify="space-between">
          <Col>
            <div>{performer.tags && renderTags(performer.tags)}</div>
          </Col>
          <Col>
            <div
              aria-hidden
              hidden={!loggedIn}
              className="p-favorite"
              onClick={() => onLike()}
            >
              {performer.isFavorite ? (
                <HeartFilled className="icon" />
              ) : (
                <HeartOutlined className="icon" />
              )}
            </div>
          </Col>
        </Row>
        <div className="about-me">{performer?.aboutMe}</div>
      </div>
    </Card.Grid>
  );
}

export default connector(GridCard);
