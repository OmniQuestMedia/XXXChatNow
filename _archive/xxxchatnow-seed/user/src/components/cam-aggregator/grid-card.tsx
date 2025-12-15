import {
  EyeOutlined
} from '@ant-design/icons';
import { renderTitle } from '@components/performer/performer-grid-card';
import {
  Card, Space, Tooltip
} from 'antd';
import Link from 'next/link';
import { connect } from 'react-redux';

import style from './cam-aggregator.module.less';

export const renderTags = (tags: string[]) => (
  <Space className="tags">
    {tags.map((tag) => (
      <Link
        href={{ pathname: '/cams', query: { tag } }}
        key={tag}
        as={`/cams?tag=${tag}`}
      >
        <a>
          #
          {tag}
        </a>
      </Link>
    ))}
  </Space>
);

function AggregatorProfileGridCard({
  performer = {} as any,
  className = null,
  countries = [],
  placeholderAvatarUrl = null
}: any) {
  const { isOnline, streamingStatus } = performer;
  const country = countries.find((c) => c.code === performer.country);
  const renderCountry = country && (
    <Tooltip title={country.name}>
      <img className={style['cam-flag']} src={country.flag} alt="" />
    </Tooltip>
  );
  let serviceImage = '';
  switch (performer.service) {
    case 'chaturbate':
      serviceImage = '/logo-chaturbate.svg';
      break;
    case 'xlovecam':
      serviceImage = '/logo-xlovecam.png';
      break;
    case 'bongacams':
      serviceImage = '/logo-bongacam.png';
      break;
    case 'stripcash':
      serviceImage = '/logo-stripcash.png';
      break;
    default:
      break;
  }
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
  const defaultPlaceholderAvatarUrl = placeholderAvatarUrl || '/default-user-icon.png';
  return (
    <Card.Grid className={className} key={performer._id} hoverable={false}>
      <Link
        href={{
          pathname: '/cams/details',
          query: { username: performer.username }
        }}
        as={`/cams/${performer.username}`}
      >
        <a>
          <div
            className="performer-avatar"
            style={{
              backgroundImage: `url(${
                typeof performer.avatar === 'string'
                && performer.avatar.length > 0
                  ? performer.avatar
                  : defaultPlaceholderAvatarUrl
              })`
            }}
          >
            <span className={statusClassNames.join(' ')}>{status}</span>
            {serviceImage && <img className={style['cam-logo']} src={serviceImage} alt={performer.service} />}
            {renderTitle(performer.gender, performer.username)}
            {renderCountry}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            overflow: 'hidden'
          }}
        >
          {performer.tags && performer.tags.length > 0 && renderTags(performer.tags.slice(0, 4))}
        </div>
        <div className="about-me">{performer?.aboutMe}</div>
      </div>
    </Card.Grid>
  );
}

const mapState = (state) => ({
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl,
  countries: state.settings.countries
});

export default connect(mapState)(AggregatorProfileGridCard);
