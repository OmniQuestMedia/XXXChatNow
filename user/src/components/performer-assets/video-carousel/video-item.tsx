import { LockOutlined, PlayCircleOutlined } from '@ant-design/icons';
import NumberFormat from '@components/common/layout/numberformat';
import { Tag } from 'antd';
import Link from 'next/link';
import React from 'react';
import { IVideo } from 'src/interfaces';
import { defaultColor, formatDuration } from 'src/lib';

import style from './video-item.module.less';

interface IProps {
  video: IVideo;
}
const generateToken = (token: number, isSale: boolean) => (
  <Tag color={isSale ? defaultColor.primaryColor : defaultColor.successColor}>
    {isSale ? <NumberFormat value={token} suffix=" tokens" /> : 'FREE'}
  </Tag>
);

export function VideoItem({ video }: IProps) {
  return (
    <div className={style.item}>
      <div
        className="item-image"
        style={{ backgroundImage: `url(${video.thumbnail || video?.video?.thumbnails[0] || '/no-image.jpg'})` }}
      >
        {!video.isBought
          && (
            <div className="value">
              {generateToken(video.token, video.isSaleVideo)}
            </div>
          )}

        {video.isSaleVideo && !video.isBought && (
          <div className="item-lock">
            <LockOutlined />
          </div>
        )}
        {video.video && video.video.duration && (
          <div className="item-duration ant-tag ant-tag-has-color">
            {formatDuration(video.video.duration)}
          </div>
        )}
        <Link
          shallow={false}
          href={{
            pathname: '/videos/[id]',
            query: { id: video._id, data: JSON.stringify(video) }
          }}
          as={`/videos/${video._id}`}
        >
          <a>
            <PlayCircleOutlined className="icon-play" />
          </a>
        </Link>
      </div>
      <div className="item-title">
        <span className="item-name">{video.title}</span>
      </div>
    </div>
  );
}

export default VideoItem;
