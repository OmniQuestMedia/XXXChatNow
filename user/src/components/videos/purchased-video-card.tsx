import { PlayCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import React from 'react';
import { IPerformer, IVideo } from 'src/interfaces';

import style from './purchased-video-card.module.less';

interface IProps {
  video: IVideo;
  performer: IPerformer;
  onClick: () => void;
}

function PurchasedVideoCard({ video, performer, onClick }: IProps) {
  const { title, thumbnail, _id } = video;
  return (
    <div className={style['purchased-video-card']}>
      <div className="purchased-video-card-thumb">
        <span>
          <PlayCircleOutlined onClick={onClick} />
        </span>
        <img src={thumbnail || video.video?.thumbnails[0]} alt="" />
      </div>
      <div className="purchased-video-card-name">
        <Link
          href={{
            pathname: '/videos/[id]',
            query: { id: _id, data: JSON.stringify({ ...video, performer }) }
          }}
          as={`/videos/${_id}`}
        >
          <a>{title}</a>
        </Link>
      </div>
    </div>
  );
}

export default PurchasedVideoCard;
