import { getResponseError, redirect } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import nextCookie from 'next-cookies';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IPhoto, IResponse } from 'src/interfaces';
import { photoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PhotoForm = dynamic(() => import('@components/photos/photo-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
  photo: IPhoto;
}

function UpdatePerformerPhotoPage({
  performer,
  photo
}: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await photoService.update(`/performer/performer-assets/photos/${photo._id}`, {
        ...data,
        performerId: performer._id
      });
      message.success('Update photo success.');
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
      <PageTitle title="Update photo" />
      <PageHeader title="Update a Photo" />
      <PhotoForm
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        photo={photo}
      />
    </div>
  );
}

UpdatePerformerPhotoPage.authenticate = true;
UpdatePerformerPhotoPage.layout = 'primary';
UpdatePerformerPhotoPage.getInitialProps = async (ctx) => {
  try {
    const {
      query: { data, id }
    } = ctx;
    if (typeof window !== 'undefined' && data) {
      return {
        photo: JSON.parse(data)
      };
    }

    const { token } = nextCookie(ctx);
    const resp: IResponse<IPhoto> = await photoService.details(id, {
      Authorization: token
    });
    return {
      photo: resp.data
    };
  } catch (e) {
    return redirect('/404', ctx);
  }
};

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(UpdatePerformerPhotoPage);
