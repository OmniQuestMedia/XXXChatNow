import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons';
import { Button, Skeleton } from 'antd';
import Router from 'next/router';
import React from 'react';
import { IPerformer } from 'src/interfaces';

import style from './performer-carousel.module.less';
import PerformerGrid from './performer-grid';

interface IProps {
  performers: IPerformer[];
  searching?: boolean;
}

export function PerformerCarousel({
  performers,
  searching = false
}: IProps) {
  const ref = React.useRef(null);
  const [paddleShowing, setPaddleShowing] = React.useState(false);
  React.useEffect(() => {
    const performerListElement = document.getElementsByClassName(
      'performer-grid'
    );
    if (
      performerListElement.length
      && performerListElement[0].clientWidth < performerListElement[0].scrollWidth
    ) {
      setPaddleShowing(true);
    }
  }, [performers]);
  const scrollTo = (width?: number) => {
    const e: HTMLElement = ref.current;
    e.scroll({ left: width, behavior: 'smooth' });
  };

  if (searching) return <Skeleton loading paragraph={{ rows: 4 }} />;
  if (!performers.length) return null;

  return (
    <div className={style['performer-carousel']}>
      <div className="carousel-header">
        <span className="carousel-title">Related Cams</span>
        <Button type="primary" onClick={() => Router.push('/')}>
          See all Items
        </Button>
      </div>
      <LeftCircleFilled
        className="left-paddle paddle"
        hidden={!paddleShowing}
        onClick={() => scrollTo(-ref.current.clientWidth)}
      />
      <PerformerGrid
        total={performers.length}
        data={performers}
        searching={false}
        success
      />
      <RightCircleFilled
        hidden={!paddleShowing}
        className="right-paddle paddle"
        onClick={() => scrollTo(ref.current.clientWidth)}
      />
    </div>
  );
}

export default PerformerCarousel;
