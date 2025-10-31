import './index.less';

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
import Loader from '@components/common/base/loader';
import Banner from '@components/common/layout/banner';
import {
  Card, Col, Pagination,
  Row, Space
} from 'antd';
import { chunk } from 'lodash';
import Link from 'next/link';
import * as React from 'react';
import { connect } from 'react-redux';
import { GENDER, IBanner, IPerformer } from 'src/interfaces';
import { defaultColor } from 'src/lib';

interface IProps {
  loggedIn?: boolean;
  setFilter?: Function;
  limit?: number;
  offset?: number;
  data: IPerformer[];
  total?: number;
  success?: boolean;
  // error?: any;
  searching?: boolean;
  title?: string | string[];
  onLike?: Function;
  isPage?: boolean;
  rightBanners?: IBanner[];
  placeholderAvatarUrl?: string;
  render?: (performer: IPerformer) => React.ReactNode;
}

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
  <Space className="tags">
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

interface IGridCard {
  performer: IPerformer;
  loggedIn: boolean;
  onLike: any;
  className: string;
  placeholderAvatarUrl: string;
}
export function GridCard({
  performer,
  loggedIn,
  onLike,
  className,
  placeholderAvatarUrl
}: IGridCard) {
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
              backgroundImage: `url(${
                typeof performer.avatar === 'string'
                && performer.avatar.length > 0
                  ? performer.avatar
                  : defaultPlaceholderAvatarUrl
              })`
            }}
          >
            <span className={statusClassNames.join(' ')}>{status}</span>
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

function RowGrid({
  data,
  loggedIn,
  onLike,
  placeholderAvatarUrl
}: {
  data: IPerformer[];
  loggedIn: boolean;
  onLike: Function;
  placeholderAvatarUrl: string;
}) {
  return (
    <Row style={{ width: '100%' }}>
      {data
      && data.length > 0
      && data.map((performer: IPerformer) => (
        <GridCard
          placeholderAvatarUrl={placeholderAvatarUrl}
          className="performer-box"
          key={performer._id}
          performer={performer}
          loggedIn={loggedIn}
          onLike={onLike}
        />
      ))}
    </Row>
  );
}

const renderGrid = (
  data: IPerformer[],
  loggedIn: boolean,
  onLike: Function,
  rightBanners: IBanner[],
  placeholderAvatarUrl: string
) => {
  const { length } = data;
  if (length <= 12) {
    return (
      <Row>
        {rightBanners && rightBanners.length > 0 ? (
          <>
            <Col lg={16} md={16} xs={24}>
              <Row>
                {data
                  && data.length > 0
                  && data.map((performer: IPerformer) => (
                    <GridCard
                      placeholderAvatarUrl={placeholderAvatarUrl}
                      className="performer-box performer-box-4-item"
                      key={performer._id}
                      performer={performer}
                      loggedIn={loggedIn}
                      onLike={() => onLike(performer)}
                    />
                  ))}
              </Row>
            </Col>
            <Col lg={8} md={8} xs={24}>
              <Banner
                classnames="right-banners"
                banners={rightBanners}
                styleImage={{ padding: '10px', width: '100%' }}
              />
            </Col>
          </>
        ) : (
          data
          && data.length > 0
          && data.map((performer: IPerformer) => (
            <GridCard
              placeholderAvatarUrl={placeholderAvatarUrl}
              className="performer-box"
              key={performer._id}
              performer={performer}
              loggedIn={loggedIn}
              onLike={() => onLike(performer)}
            />
          ))
        )}
      </Row>
    );
  }
  if (length > 12 && length <= 24) {
    const dataChunk = chunk(data, 12);
    return rightBanners && rightBanners.length > 0 ? (
      <>
        <Row>
          <Col lg={16} md={16} xs={24}>
            <Row>
              {dataChunk[0]
                && dataChunk[0].length > 0
                && dataChunk[0].map((performer: IPerformer) => (
                  <GridCard
                    placeholderAvatarUrl={placeholderAvatarUrl}
                    className="performer-box performer-box-4-item"
                    key={performer._id}
                    performer={performer}
                    loggedIn={loggedIn}
                    onLike={() => onLike(performer)}
                  />
                ))}
            </Row>
          </Col>
          <Col lg={8} md={8} xs={24}>
            {rightBanners && rightBanners.length > 0 && (
              <Banner
                classnames="right-banners"
                banners={rightBanners}
                styleImage={{ padding: '10px', width: '100%' }}
              />
            )}
          </Col>
        </Row>
        <RowGrid
          placeholderAvatarUrl={placeholderAvatarUrl}
          data={dataChunk[1]}
          loggedIn={loggedIn}
          onLike={onLike}
        />
      </>
    ) : (
      <RowGrid
        placeholderAvatarUrl={placeholderAvatarUrl}
        data={data}
        loggedIn={loggedIn}
        onLike={onLike}
      />
    );
  }
  if (length > 24 && length <= 36) {
    const dataChunk = chunk(data, 12);
    return (
      <>
        <RowGrid
          placeholderAvatarUrl={placeholderAvatarUrl}
          data={dataChunk[0]}
          loggedIn={loggedIn}
          onLike={onLike}
        />
        {rightBanners && rightBanners.length > 0 ? (
          <Row style={{ width: '100%' }}>
            <Col xl={16} lg={18} md={18} xs={24}>
              <Row>
                {dataChunk[1]
                  && dataChunk[1].length > 0
                  && dataChunk[1].map((performer: IPerformer) => (
                    <GridCard
                      placeholderAvatarUrl={placeholderAvatarUrl}
                      className="performer-box performer-box-4-item"
                      key={performer._id}
                      performer={performer}
                      loggedIn={loggedIn}
                      onLike={() => onLike(performer)}
                    />
                  ))}
              </Row>
            </Col>
            <Col xl={8} lg={6} md={6} xs={24}>
              <Banner
                classnames="right-banners"
                banners={rightBanners}
                styleImage={{ padding: '10px', width: '100%' }}
              />
            </Col>
          </Row>
        ) : (
          <RowGrid
            placeholderAvatarUrl={placeholderAvatarUrl}
            data={dataChunk[1]}
            loggedIn={loggedIn}
            onLike={onLike}
          />
        )}
        <RowGrid
          placeholderAvatarUrl={placeholderAvatarUrl}
          data={dataChunk[2]}
          loggedIn={loggedIn}
          onLike={onLike}
        />
      </>
    );
  }
  if (length > 36) {
    const dataChunk = chunk(data, 12);
    return (
      <>
        <RowGrid
          placeholderAvatarUrl={placeholderAvatarUrl}
          data={dataChunk[0]}
          loggedIn={loggedIn}
          onLike={onLike}
        />
        {rightBanners && rightBanners.length > 0 ? (
          <Row style={{ width: '100%' }}>
            <Col xl={16} lg={18} md={18} xs={24}>
              <Row>
                {dataChunk[1]
                  && dataChunk[1].length > 0
                  && dataChunk[1].map((performer: IPerformer) => (
                    <GridCard
                      placeholderAvatarUrl={placeholderAvatarUrl}
                      className="performer-box performer-box-4-item"
                      key={performer._id}
                      performer={performer}
                      loggedIn={loggedIn}
                      onLike={() => onLike(performer)}
                    />
                  ))}
              </Row>
            </Col>
            <Col xl={8} lg={6} md={6} xs={24}>
              <Banner
                classnames="right-banners"
                banners={rightBanners}
                styleImage={{ padding: '10px', width: '100%' }}
              />
            </Col>
          </Row>
        ) : (
          <RowGrid
            placeholderAvatarUrl={placeholderAvatarUrl}
            data={dataChunk[1]}
            loggedIn={loggedIn}
            onLike={onLike}
          />
        )}
        <RowGrid
          placeholderAvatarUrl={placeholderAvatarUrl}
          data={dataChunk[2]}
          loggedIn={loggedIn}
          onLike={onLike}
        />
        {dataChunk.splice(0, 3)
          && dataChunk.splice(0, 3).length > 0
          && dataChunk.splice(0, 3).map((v, i) => (
            <RowGrid
              placeholderAvatarUrl={placeholderAvatarUrl}
              // eslint-disable-next-line react/no-array-index-key
              key={`row-grid-${i}`}
              data={v}
              loggedIn={loggedIn}
              onLike={onLike}
            />
          ))}
      </>
    );
  }
  return null;
};

function PerformerGrid({
  data,
  searching = false,
  success = false,
  title = '',
  onLike = () => {},
  loggedIn = false,
  isPage = false,
  rightBanners = [],
  offset = 0,
  limit = 10,
  total = 0,
  setFilter = null,
  placeholderAvatarUrl = '/no-avatar.png',
  render = null
}: IProps) {
  const actions = setFilter && total > 0
    ? [
      total >= 60 && (
        <Pagination
          disabled={searching}
          current={Math.round(offset / limit) + 1}
          pageSize={limit}
          total={total}
          size="small"
          onChange={(page) => setFilter('offset', (page - 1) * limit)}
        />
      )
    ]
    : [];

  if (render) {
    /**
     * placeholderAvatarUrl props
     */
    return (
      <Card
        className="performer-grid"
        title={title}
        bordered={false}
        hoverable={false}
        bodyStyle={{ padding: '0' }}
        actions={actions}
      >
        <Loader spinning={searching} />
        {data.length > 0 && data.map((performer) => render(performer))}
      </Card>
    );
  }

  return (
    <Card
      className="performer-grid"
      title={title}
      bordered={false}
      hoverable={false}
      bodyStyle={{ padding: '0' }}
      actions={actions}
    >
      <Loader spinning={searching} />
      {success
        // eslint-disable-next-line no-nested-ternary
        && (total > 0 ? (
          isPage ? (
            renderGrid(
              data,
              loggedIn,
              onLike,
              rightBanners,
              placeholderAvatarUrl
            )
          ) : (
            data.map((performer) => (
              <Col xl={6} md={8} sm={10} xs={16} key={performer._id}>
                <GridCard
                  key={performer?._id}
                  placeholderAvatarUrl={placeholderAvatarUrl}
                  className="performer-box"
                  performer={performer}
                  loggedIn={loggedIn}
                  onLike={(p: IPerformer) => onLike(p)}
                />
              </Col>
            ))
          )
        ) : (
          <div className="ant-card-head">No model found.</div>
        ))}
    </Card>
  );
}

const mapStates = (state: any) => ({
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl
});

const mapDispatch = {};
export default connect(mapStates, mapDispatch)(PerformerGrid);
