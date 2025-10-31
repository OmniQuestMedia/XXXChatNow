import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer } from 'src/interfaces';
import { videoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const VideoForm = dynamic(() => import('@components/videos/video-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
}

function CreatePerformerVideosPage({ performer }: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await videoService.create('/performer/performer-assets/videos/upload', {
        ...data,
        performerId: performer._id
      });
      message.success('Add video success.');
      Router.back();
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };

  return (
    <div className={style['performer-videos-page']}>
      <PageTitle title="Upload video" />
      <PageHeader title="Create new Video" />
      <VideoForm
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        video={{}}
      />
    </div>
  );
}

CreatePerformerVideosPage.authenticate = true;
CreatePerformerVideosPage.layout = 'primary';

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(CreatePerformerVideosPage);
