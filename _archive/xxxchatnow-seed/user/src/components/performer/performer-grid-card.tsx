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
import {
  Card, Space
} from 'antd';
import Link from 'next/link';
import { connect } from 'react-redux';
import {
  GENDER, ICountry,
  IPerformer
} from 'src/interfaces';
import { defaultColor } from 'src/lib';

interface IGridCard {
  performer: IPerformer;
  loggedIn: boolean;
  onLike: any;
  className: string;
  placeholderAvatarUrl: string;
  // eslint-disable-next-line react/require-default-props
  countries?: ICountry[];
}

export const renderTitle = (gender: GENDER, name: string) => (
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

const renderCountry = (country: ICountry) => country && (
  <span className="model-flag">
    {country.flag}
    {' '}
    {country.name}
  </span>
);

export const renderTags = (tags: string[]) => {
  const newTags = tags?.length > 4 ? tags.splice(0, 4) : tags;
  return (
    <Space className="tags">
      {newTags?.map((tag) => (
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
};

function GridCard({
  performer,
  loggedIn,
  onLike,
  className,
  placeholderAvatarUrl,
  countries = []
}: IGridCard) {
  const { isOnline, streamingStatus } = performer;
  const statusClassNames = ['p-status'];
  const country = countries.find((c) => c.code === performer.country);
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
      {performer.isBlocked && (
        <div className="blocked-thumb">
          <LockOutlined />
        </div>
      )}
      <Link
        href={{
          pathname: '/stream',
          query: { performer: JSON.stringify(performer) }
        }}
        as={`/profile/${performer.username}`}
      >
        <a>
          <div
            className="performer-avatar"
            style={{
              backgroundImage: `url(${typeof performer.avatar === 'string'
                && performer.avatar.length > 0
                ? performer.avatar
                : defaultPlaceholderAvatarUrl
              })`
            }}
          >
            <span className={statusClassNames.join(' ')}>{status}</span>
            {renderTitle(performer.gender, performer.username)}
            {renderCountry(country)}
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
            justifyContent: 'space-between'
          }}
        >
          <div>{performer.tags && renderTags(performer.tags)}</div>
          <div
            aria-hidden
            hidden={!loggedIn}
            style={{
              cursor: 'pointer',
              color: defaultColor.primaryColor
            }}
            onClick={() => onLike(performer)}
          >
            {performer.isFavorite ? (
              <HeartFilled className="icon" />
            ) : (
              <HeartOutlined className="icon" />
            )}
          </div>
        </div>
        <div className="about-me">{performer?.aboutMe}</div>
      </div>
    </Card.Grid>
  );
}

const mapState = (state) => ({
  countries: state.settings.countries
});

export default connect(mapState)(GridCard);
