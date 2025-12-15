import { EditOutlined } from '@ant-design/icons';
import TrashButton from '@components/common/base/trash';
import NumberFormat from '@components/common/layout/numberformat';
import {
  Alert, Button,
  Card, Space, Tag
} from 'antd';
import Router from 'next/router';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { IPerformerGallery } from 'src/interfaces';
import { formatDate } from 'src/lib';
import { capitalizeFirstLetter } from 'src/lib/string';

import style from './gallery-dashboard.module.less';

interface IProps {
  data: IPerformerGallery[];
  success?: boolean;
  error?: any;
  searching?: boolean;
  title?: string | string[];
  addGalleries?: Function;
  hasMore?: boolean;
  remove?: Function;
}

function GalleryGrid({
  data,
  searching = false,
  title = '',
  hasMore = false,
  success = true,
  error = null,
  addGalleries = () => {},
  remove = () => {}
}: IProps) {
  const renderActiveTag = (status: 'draft' | 'active' | 'inactive') => {
    switch (status) {
      case 'active':
        return (
          <Tag color="success" className={style['photo-status']}>
            Active
          </Tag>
        );
      case 'inactive':
        return (
          <Tag color="warning" className={style['photo-status']}>
            Inactive
          </Tag>
        );
      case 'draft':
        return (
          <Tag color="default" className={style['photo-status']}>
            Inactive
          </Tag>
        );
      default:
        return '';
    }
  };

  const renderSale = (isSale: boolean, token: number) => {
    switch (isSale) {
      case true:
        return (
          <Tag color="#87d068" className={style['sale-tag']}>
            <NumberFormat value={token} suffix=" Tokens" />
          </Tag>
        );
      case false:
        return (
          <Tag color="#f50" className={style['sale-tag']}>
            Free
          </Tag>
        );
      default:
        return '';
    }
  };

  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={addGalleries}
      hasMore={hasMore}
      loader={<p>Loading...</p>}
    >
      <Card className={style['photo-grid']} title={title} bordered={false}>
        {!searching ? (
          success
          && (data.length > 0 ? (
            data.map((gallery) => (
              <Card.Grid className={style['photo-box']} key={gallery._id}>
                <div className={style['photo-thumbnail']}>
                  <img
                    src={
                      (gallery.coverPhotoId
                        && gallery.coverPhoto
                        && gallery.coverPhoto.thumbnails[0])
                      || '/gallery.png'
                    }
                    alt=""
                  />
                  <Space className={style.actions}>
                    <Button
                      type="link"
                      onClick={() => Router.push({
                        pathname: '/account/performer/galleries/update',
                        query: { data: JSON.stringify(gallery) }
                      }, `/account/performer/galleries/${gallery._id}/update`)}
                    >
                      <EditOutlined />
                    </Button>
                    <TrashButton confirm={() => remove(gallery._id)} />
                  </Space>
                  {renderActiveTag(gallery.status)}
                  {renderSale(gallery.isSale, gallery.token)}
                </div>
                <div className={style['photo-info']}>
                  <span>{capitalizeFirstLetter(gallery.name)}</span>
                  <span>
                    {gallery.numOfItems}
                    {' '}
                    Items
                  </span>
                </div>
                <div className={style['photo-description']}>
                  Created At
                  {' '}
                  {formatDate(gallery.createdAt, 'DD MMMM YYYY')}
                </div>
                <div className={style['photo-description']}>{gallery.description}</div>
              </Card.Grid>
            ))
          ) : (
            <p>No items</p>
          ))
        ) : (
          <p>Loading...</p>
        )}
      </Card>
      {error && <Alert type="error" message="Error request" banner />}
    </InfiniteScroll>
  );
}

export default GalleryGrid;
