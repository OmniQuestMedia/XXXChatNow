import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer } from 'src/interfaces';
import { photoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PhotoForm = dynamic(() => import('@components/photos/photo-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
}

function CreatePerformerPhotoPage({
  performer
}: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await photoService.create('/performer/performer-assets/photos/upload', {
        ...data,
        performerId: performer._id
      });
      message.success('Add photo success.');
      Router.back();
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };
  return (
    <div className={style['performer-photos-page']}>
      <PageTitle title="Upload photo" />
      <PageHeader title="Create new Photo" />
      <PhotoForm
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        photo={{}}
      />
    </div>
  );
}

CreatePerformerPhotoPage.authenticate = true;
CreatePerformerPhotoPage.layout = 'primary';

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(CreatePerformerPhotoPage);
