import NumberFormat from '@components/common/layout/numberformat';
import { Tag } from 'antd';
import React, { PureComponent } from 'react';
import { IPerformerGallery } from 'src/interfaces';
import { defaultColor } from 'src/lib';

import style from './gallery-card.module.less';

interface P {
  gallery: IPerformerGallery;
  onHandlePurchase: Function;
}

export default class GalleryCard extends PureComponent<P> {
  render() {
    const { gallery, onHandlePurchase } = this.props;
    const {
      isSale, token, coverPhoto, name, numOfItems
    } = gallery;
    // To-do: Should create separate component
    const renderPriceTag = () => ((isSale && token) ? (
      <Tag color={defaultColor.primaryColor}>
        <NumberFormat value={token} suffix=" tokens" />
      </Tag>
    ) : (
      <Tag>
        FREE
      </Tag>
    ));
    return (
      <div
        className={style['gallery-card']}
        aria-hidden
        onClick={() => {
          onHandlePurchase(gallery, 'gallery');
        }}
      >
        <div className="gallery-thumb">
          <span className="value">{renderPriceTag()}</span>
          <img src={coverPhoto?.thumbnails[0] || '/no-image.jpg'} alt="" />
          <span className="count">
            Images:
            {' '}
            {numOfItems}
          </span>
        </div>
        <div className="gallery-info">
          <span className="name">{name}</span>
        </div>
      </div>
    );
  }
}
