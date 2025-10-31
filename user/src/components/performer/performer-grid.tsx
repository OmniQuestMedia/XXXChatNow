import Loader from '@components/common/base/loader';
import Banner from '@components/common/layout/banner';
import {
  Card, Col,
  Pagination,
  Row
} from 'antd';
import { chunk } from 'lodash';
import React from 'react';
import { IBanner, IPerformer } from 'src/interfaces';

import GridCard from './grid-card';
import style from './performer-grid.module.less';

interface IProps {
  data: IPerformer[];
  setFilter?: Function;
  limit?: number;
  offset?: number;
  total?: number;
  success?: boolean;
  banners?: IBanner[];
  searching?: boolean;
  title?: string | string[];
  isPage?: boolean;
  render?: (performer: IPerformer) => React.ReactNode;
  renderGridCard?: Function;
}

function PerformerGrid({
  data,
  setFilter = null,
  limit = 0,
  offset = 0,
  total = 0,
  success = false,
  searching = false,
  title = '',
  render = null,
  isPage = false,
  banners = [],
  renderGridCard = null
}: IProps) {
  // const [loading, setLoading] = useState(false);
  // const [featuredCreatorListing, setFfeaturedCreatorListing] = useState([]);

  const topBanners = banners.filter((b) => b.position === 'top');
  const rightBanners = banners.filter((b) => b.position === 'right');
  const bottomBanners = banners.filter((b) => b.position === 'bottom');

  function RowGrid({ dataSource }: { dataSource: IPerformer[] }) {
    return (
      <Row style={{ width: '100%' }}>
        {dataSource?.map((performer: IPerformer) => (
          renderGridCard
            ? renderGridCard({ performer })
            : (
              <GridCard
                key={performer._id}
                performer={performer}
              />
            )
        ))}
      </Row>
    );
  }

  const renderGrid = () => {
    const { length } = data;
    if (!length) return null;

    const dataChunk = chunk(data, 12);
    const firstChunk = dataChunk[0];
    const secondChunk = length > 12 ? dataChunk[1] : [];
    const thirdChunk = length > 24 ? dataChunk[2] : [];
    const lastChunk = length > 36 ? data.slice(36) : [];

    return (
      <>
        <RowGrid dataSource={firstChunk} />
        {rightBanners?.length > 0 ? (
          <Row style={{ width: '100%' }}>
            <Col xl={16} lg={18} md={18} xs={24}>
              {secondChunk.length
                && (
                  <Row>
                    {secondChunk.map((performer: IPerformer) => (
                      renderGridCard
                        ? renderGridCard({
                          performer,
                          className: 'performer-box performer-box-4-item'
                        })
                        : (
                          <GridCard
                            className="performer-box performer-box-4-item"
                            key={performer._id}
                            performer={performer}
                          />
                        )
                    ))}
                  </Row>
                )}
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
          <RowGrid dataSource={secondChunk} />
        )}
        {thirdChunk.length ? <RowGrid dataSource={thirdChunk} /> : null}
        {lastChunk.length ? <RowGrid dataSource={lastChunk} /> : null}
      </>
    );
  };

  const actions = setFilter && total > 0
    ? [
      total > limit && (
        <Pagination
          disabled={searching}
          current={Math.round(offset / limit) + 1}
          pageSize={limit}
          total={total}
          size="small"
          onChange={(page) => setFilter('offset', (page - 1) * limit)}
          showSizeChanger={false}
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
        className={style['performer-grid']}
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
    <>

      {isPage && topBanners?.length > 0 && (
        <div style={{ order: -1 }} className="top-banner">
          <Banner
            banners={topBanners}
            styleImage={{
              padding: '10px', width: '100%', marginBottom: '20px', objectFit: 'cover'
            }}
          />
        </div>
      )}
      <Card
        className={style['performer-grid']}
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
              renderGrid()
            ) : (
              <Row style={{ width: '100%' }}>
                {data.map((performer) => (
                  renderGridCard
                    ? renderGridCard({ performer })
                    : (
                      <GridCard
                        key={performer?._id}
                        performer={performer}
                      />
                    )
                ))}
              </Row>
            )
          ) : (
            <div className="ant-card-head">No model found.</div>
          ))}
      </Card>
      {isPage && bottomBanners?.length > 0 && (
        <div className="bottom-banner">
          <Banner
            banners={bottomBanners}
            styleImage={{ padding: '10px', width: '100%' }}
          />
        </div>
      )}
    </>
  );
}

export default PerformerGrid;
