import PopupVideoDetail from '@components/videos/popup-video';
import { getResponseError } from '@lib/utils';
import {
  addMyVideos,
  getMyVideos,
  removeMyVideo
} from '@redux/performer/actions';
import { IResponse } from '@services/api-request';
import { Button, message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IDataResponse, IVideo } from 'src/interfaces';
import { videoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Loader = dynamic(() => import('@components/common/base/loader'));
const VideoGrid = dynamic(() => import('@components/videos/video-grid'), { ssr: false });

interface IProps {
  data: IVideo[];
  total: number;
  searching: boolean;
  success: boolean;
  getMyVideos: Function;
  removeMyVideo: Function;
  addMyVideos: Function;
}

let modalRef: any;

function PerformerVideosPage({
  data,
  searching,
  total,
  success,
  getMyVideos: dispatchGetMyVideos,
  removeMyVideo: dispatchRemoveMyVideo,
  addMyVideos: dispatchAddMyVideos
}: IProps) {
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  const loadVideos = () => {
    dispatchGetMyVideos({ limit, offset: 0 });
  };

  const showError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const onRemove = async (id: string) => {
    try {
      await videoService.removeMyVideo(id);
      message.success('Removed!');
      dispatchRemoveMyVideo(id);
    } catch (e) {
      showError(e);
    }
  };

  const addVideos = async () => {
    try {
      const result = limit + offset;
      const resp: IResponse<IDataResponse<IVideo>> = await videoService.myVideos({ limit, offset });
      dispatchAddMyVideos(resp.data.data);
      setOffset(result);
    } catch (e) {
      showError(e);
    }
  };

  return (
    <div className={style['performer-videos-page']}>
      <PageTitle title="My videos" />
      <PageHeader
        title="Videos"
        extra={(
          <Button
            type="primary"
            onClick={() => Router.push('/account/performer/videos/add')}
          >
            Upload Video
          </Button>
          )}
      />
      <Loader spinning={searching} />
      <VideoGrid
        success={success}
        addVideos={addVideos.bind(this)}
        remove={onRemove.bind(this)}
        data={data}
        hasMore={!searching && data.length < total}
        title=""
        onViewVideo={(video: IVideo) => modalRef.show(video.video.url || '')}
      />
      <PopupVideoDetail ref={(ref) => { modalRef = ref; }} />
    </div>
  );
}

PerformerVideosPage.authenticate = true;
PerformerVideosPage.layout = 'primary';

const mapStateToProps = (state) => ({
  ...state.performer.assets.videos
});
const mapDispatch = { getMyVideos, removeMyVideo, addMyVideos };
export default connect(mapStateToProps, mapDispatch)(PerformerVideosPage);
