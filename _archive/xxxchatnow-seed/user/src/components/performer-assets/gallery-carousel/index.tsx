import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons';
import GalleryCard from '@components/galleries/gallery-card';
import {
  Button, Col, Row, Skeleton
} from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { IPerformer, IPerformerGallery } from 'src/interfaces';

import style from './index.module.less';

interface IProps {
  performer: IPerformer;
  galleries: IPerformerGallery[];
  searching?: boolean;
  purchaseGallery?: (item: IPerformerGallery, type: string) => void;
}

function Gallery({
  performer,
  galleries,
  searching = false,
  purchaseGallery = () => { }
}: IProps) {
  const ref = useRef(null);
  const router = useRouter();
  const [paddleShowing, setPaddleShowing] = useState(false);

  const scrollTo = (width?: number) => {
    const e: HTMLElement = ref.current;
    e.scroll({ left: width, behavior: 'smooth' });
  };

  useEffect(() => {
    const galleryListElement = document.getElementsByClassName('gallery-list');
    if (
      galleryListElement.length
      && galleryListElement[0].clientWidth < galleryListElement[0].scrollWidth
    ) {
      setPaddleShowing(true);
    }
  }, [performer]);

  if (searching) return <Skeleton loading paragraph={{ rows: 4 }} />;
  if (!galleries.length) return null;

  return (
    <div className={style['gallery-carousel']}>
      <div className="gallery-header">
        <span className="shop-name">{`${performer.username}'s Galleries`}</span>
        <Button type="primary" onClick={() => { router.push(`/galleries?username=${performer.username}`); }}>See all Items</Button>
      </div>
      <LeftCircleFilled
        className={style['left-paddle paddle']}
        hidden={!paddleShowing}
        onClick={() => scrollTo(-ref.current.clientWidth)}
      />
      <Row
        className={style['gallery-list']}
        ref={ref}
        gutter={[
          { sm: 25, xs: 10 },
          { sm: 10, xs: 25 }
        ]}
      >
        {galleries.map((gallery) => (
          <Col xl={6} md={8} sm={10} xs={16} key={gallery._id} className={style['pad12-5']}>
            <GalleryCard gallery={gallery} onHandlePurchase={purchaseGallery} />
          </Col>
        ))}
      </Row>
      <RightCircleFilled
        hidden={!paddleShowing}
        className={style['right-paddle paddle']}
        onClick={() => scrollTo(ref.current.clientWidth)}
      />
    </div>
  );
}

export default Gallery;
