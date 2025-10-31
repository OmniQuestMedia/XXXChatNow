import { EditOutlined, PlayCircleOutlined } from '@ant-design/icons';
import TrashButton from '@components/common/base/trash';
import { Card, Space } from 'antd';
import Link from 'next/link';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { IVideo } from 'src/interfaces';
import { capitalizeFirstLetter } from 'src/lib/string';

import style from './video-grid.module.less';

interface IProps {
  data: IVideo[];
  success?: boolean;
  title?: string | string[];
  addVideos?: Function;
  hasMore?: boolean;
  remove?: Function;
  onViewVideo?: Function;
}

function VideoGrid({
  data,
  success = false,
  title = '',
  hasMore = false,
  addVideos = () => {},
  remove = () => {},
  onViewVideo = () => {}
}: IProps) {
  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={addVideos}
      hasMore={hasMore}
    >
      <Card className={style['video-grid']} title={title} bordered={false}>
        {success && (
          data.length > 0 ? (
            data.map((video: IVideo) => (
              <Card.Grid className={style['video-box']} key={video._id}>
                <div className={style['video-thumbnail']}>
                  <img src={video.thumbnail || '/no-image.jpg'} alt="" />
                  <a className={style['play-icon']}>
                    <PlayCircleOutlined onClick={() => onViewVideo(video)} />
                  </a>
                </div>
                <div className={style['video-info']}>
                  <div>
                    Status:
                    {' '}
                    <strong>{capitalizeFirstLetter(video.status)}</strong>
                  </div>
                  <Space>
                    <Link
                      href={{
                        pathname: '/account/performer/videos/update',
                        query: { video: JSON.stringify(video) }
                      }}
                      as={`/account/performer/videos/${video._id}/update`}
                    >
                      <a>
                        <EditOutlined />
                      </a>
                    </Link>
                    <TrashButton confirm={() => remove(video._id)} />
                  </Space>
                </div>
              </Card.Grid>
            ))
          ) : (
            <p>
              There is no videos, click
              {' '}
              <Link href="/account/performer/videos/add">
                <a>here</a>
              </Link>
              {' '}
              to upload
            </p>
          )
        )}
      </Card>
    </InfiniteScroll>
  );
}

export default VideoGrid;
