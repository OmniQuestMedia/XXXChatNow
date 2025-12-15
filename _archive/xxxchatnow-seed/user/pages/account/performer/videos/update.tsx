import { getResponseError, redirect } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import nextCookie from 'next-cookies';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IResponse, IVideo } from 'src/interfaces';
import { videoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const VideoForm = dynamic(() => import('@components/videos/video-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
  video: IVideo;
}

function CreatePerformerVideosPage({ performer, video }: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await videoService.update(
        `/performer/performer-assets/videos/${video._id}`,
        { ...data, performerId: performer._id }
      );
      message.success('Update video success.');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };

  return (
    <div className={style['performer-videos-page']}>
      <PageTitle title={`Update video - ${video.title}`} />
      <PageHeader title="Update a Video" />
      <VideoForm
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        video={video}
      />
    </div>
  );
}

const mapStateToProps = (state) => ({
  performer: state.performer.current
});

CreatePerformerVideosPage.authenticate = true;
CreatePerformerVideosPage.layout = 'primary';
CreatePerformerVideosPage.getInitialProps = async (ctx) => {
  try {
    const {
      query: { video, id }
    } = ctx;
    if (typeof window !== 'undefined' && video) {
      return {
        video: JSON.parse(video)
      };
    }

    const { token } = nextCookie(ctx);
    const resp: IResponse<IVideo> = await videoService.details(id, {
      Authorization: token
    });
    return {
      video: resp.data
    };
  } catch (e) {
    return redirect('/404', ctx);
  }
};

export default connect(mapStateToProps)(CreatePerformerVideosPage);
