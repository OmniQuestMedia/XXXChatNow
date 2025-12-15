import { Carousel } from 'antd';
import React from 'react';
import { IBanner } from 'src/interfaces';

interface IProps {
  banners: IBanner[];
  styleImage: { [key: string]: any };
  classnames?: string;
}
const renderBanner = (banner: IBanner, styleImage: { [key: string]: any }) => {
  const {
    type, href, _id, photo, contentHTML
  } = banner;
  if (type === 'html' && contentHTML) {
    // eslint-disable-next-line react/no-danger
    return <div className="sun-editor-editable" dangerouslySetInnerHTML={{ __html: contentHTML }} style={styleImage || {}} />;
  }

  return (
    <a
      href={href || '#'}
      target="_blank"
      rel="noreferrer"
      key={_id}

    >
      <div className="item-slider-right">
        <div
          className="img-slider-right"
          style={{
            backgroundImage: `url(${photo && photo.url})`
          }}
        >
          <img
            src={photo && photo.url}
            alt=""
            style={styleImage || {}}
          />
        </div>
      </div>
    </a>
  );
};
function Banner({ banners, styleImage, classnames = '' }: IProps) {
  return (
    <div>
      {banners && banners.length > 0 && (
        <Carousel autoplay arrows dots={false} effect="fade" className={classnames}>
            {banners.map((item) => (renderBanner(item, styleImage)
            ))}
        </Carousel>
      )}
    </div>
  );
}

export default Banner;
