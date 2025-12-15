import NumberFormat from '@components/common/layout/numberformat';
import { Tag } from 'antd';
import Link from 'next/link';
import React from 'react';
import { IVideo } from 'src/interfaces';
import { defaultColor } from 'src/lib';

import style from './video-single-card.module.less';

interface IProps {
  video: IVideo;
}

const generateToken = (token: number, isSale: boolean) => token && (
  <Tag color={token > 0 ? defaultColor.primaryColor : '#ccc'}>
    {isSale && token > 0 ? <NumberFormat value={token} suffix=" tokens" /> : 'FREE'}
  </Tag>
);

function VideoSingleCard({ video }: IProps) {
  const {
    token, title, thumbnail, isSaleVideo, _id
  } = video;
  return (
    <div className={style['video-single-card']}>
      <div className="video-single-card-thumb">
        <div className="value">{generateToken(token, isSaleVideo)}</div>
        <Link
          href={{
            pathname: '/videos/[id]',
            query: { id: _id, data: JSON.stringify(video) }
          }}
          as={`/videos/${_id}`}
        >
          <a>
            <img src={(thumbnail && thumbnail !== 'null' && thumbnail) || video.video.thumbnails[0]} alt="" />
          </a>
        </Link>
      </div>
      <div className="info">{title}</div>
    </div>
  );
}

export default VideoSingleCard;
