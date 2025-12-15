import { EditOutlined } from '@ant-design/icons';
import TrashButton from '@components/common/base/trash';
import { Card, Space, Tag } from 'antd';
import Link from 'next/link';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { IPhoto } from 'src/interfaces';
import { formatDate } from 'src/lib';
import { capitalizeFirstLetter } from 'src/lib/string';

// import Loader from '@components/common/base/loader';
import style from './index.module.less';

interface IProps {
  data: IPhoto[];
  success?: boolean;
  // error?: any;
  searching?: boolean;
  title?: string | string[];
  addPhotos?: Function;
  hasMore?: boolean;
  remove?: Function;
}

const renderActiveTag = (status: 'draft' | 'active' | 'inactive') => {
  switch (status) {
    case 'active':
      return (
        <Tag color="#87d068" className={style['photo-status']}>
          Active
        </Tag>
      );
    case 'inactive':
      return (
        <Tag color="#f50" className={style['photo-status']}>
          Inactive
        </Tag>
      );
    case 'draft':
      return <Tag className={style['photo-status']}>Inactive</Tag>;
    default:
      return '';
  }
};

function PhotoDashboard({
  data,
  searching = false,
  title = '',
  hasMore = false,
  success = false,
  addPhotos = () => {},
  remove = () => {}
}: IProps) {
  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={addPhotos}
      hasMore={hasMore}
      loader={<p>Loading...</p>}
    >
      <Card className={style['photo-grid']} title={title} bordered={false}>
        {!searching ? (
          success
          && (data.length > 0 ? (
            data.map((photo) => (
              <Card.Grid className={style['photo-box']} key={photo._id}>
                <div className={style['photo-thumbnail']}>
                  <img src={photo.photo.thumbnails[0] || '/no-image.jpg'} alt="" />
                  <Space className={style.actions}>
                    <Link
                      href={{
                        pathname: '/account/performer/photos/update',
                        query: { data: JSON.stringify(photo) }
                      }}
                      as={`/account/performer/photos/${photo._id}/update`}
                    >
                      <EditOutlined style={{ color: 'var(--primary)' }} />
                    </Link>
                    <TrashButton confirm={() => remove(photo._id)} />
                  </Space>
                  {renderActiveTag(photo.status)}
                </div>
                <div className={style['photo-info']}>
                  <span>{capitalizeFirstLetter(photo.title)}</span>
                </div>
                <div className={style['photo-description']}>
                  Created at
                  {' '}
                  {formatDate(photo.createdAt, 'DD MMMM YYYY')}
                </div>
                <div className={style['photo-description']}>
                  <Link
                    href={{
                      pathname: '/account/performer/galleries/update',
                      query: { data: JSON.stringify(photo.gallery) }
                    }}
                    as={`/account/performer/galleries/${photo.gallery._id}/update`}
                  >
                    {photo.gallery.name}
                  </Link>
                </div>
              </Card.Grid>
            ))
          ) : (
            <p>No items</p>
          ))
        ) : (
          <p>Loading...</p>
        )}
      </Card>
    </InfiniteScroll>
  );
}

export default PhotoDashboard;
