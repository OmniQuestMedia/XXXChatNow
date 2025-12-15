import Link from 'next/link';
import React from 'react';
import { IPerformerGallery } from 'src/interfaces';

import style from './purchased-gallery-card.module.less';

interface IProps {
  gallery: IPerformerGallery;
}

function PurchasedGalleryCard({ gallery }: IProps) {
  const { name, coverPhoto, _id } = gallery;
  return (
    <div className={style['purchased-gallery-card']}>
      <div className="purchased-gallery-card-thumb">
        <Link
          href={{
            pathname: '/photos',
            query: {
              data: JSON.stringify(gallery),
              id: _id
            }
          }}
          as={`/photos/${_id}`}
        >
          <a>
            <img src={coverPhoto?.thumbnails ? coverPhoto.thumbnails[0] : '/gallery.png'} alt="" />
          </a>
        </Link>
      </div>
      <div className="purchased-gallery-card-name">{name}</div>
    </div>
  );
}

export default PurchasedGalleryCard;
