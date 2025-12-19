import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons';
import {
  Button, Col, Row, Skeleton
} from 'antd';
import Router from 'next/router';
import React from 'react';
import { IPerformer, IVideo } from 'src/interfaces';

import style from './index.module.less';
import PerformerVideo from './video-item';

interface IProps {
  performer: IPerformer;
  videos: IVideo[];
  searching?: boolean;
}

export function VideoCarousel({
  performer,
  videos,
  searching = false
}: IProps) {
  const ref = React.useRef(null);
  const [paddleShowing, setPaddleShowing] = React.useState(false);
  React.useEffect(() => {
    const videoListElement = document.querySelector('.video-list');
    if (!videoListElement) {
      return;
    }

    if (videoListElement.clientWidth < videoListElement.scrollWidth) {
      setPaddleShowing(true);
    }
  }, [performer]);

  const scrollTo = (width: number) => {
    const e: HTMLElement = ref.current;
    e.scroll({ left: width, behavior: 'smooth' });
  };

  if (searching) return <Skeleton loading paragraph={{ rows: 4 }} />;
  if (!videos.length) return null;

  return (
    <div className={style['video-carousel']}>
      <div className={style['video-header']}>
        <span className={style['shop-name']}>{`${performer.username}'s Videos`}</span>
        <Button
          type="primary"
          onClick={() => {
            Router.push(`/videos?username=${performer.username}`);
          }}
        >
          See all Items
        </Button>
      </div>
      <LeftCircleFilled
        className={style['left-paddle paddle']}
        hidden={!paddleShowing}
        onClick={() => scrollTo(-ref.current.clientWidth)}
      />
      <Row
        className={style['video-list']}
        ref={ref}
        gutter={[
          { sm: 25, xs: 10 },
          { sm: 10, xs: 25 }
        ]}
      >
        {videos.map((video) => (
          <Col xl={6} md={8} sm={10} xs={16} key={video._id} className={style['pad12-5']}>
            <PerformerVideo video={video} />
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

export default VideoCarousel;
