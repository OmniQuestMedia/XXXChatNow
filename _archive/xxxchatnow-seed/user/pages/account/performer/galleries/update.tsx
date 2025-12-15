import { getResponseError, redirect } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import nextCookie from 'next-cookies';
import { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IPerformerGallery, IResponse } from 'src/interfaces';
import { galleryService, photoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Form = dynamic(() => import('@components/photos/gallery-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
  gallery: IPerformerGallery;
}

function UpdatePerformerGalleryPage({
  performer,
  gallery
}: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const showError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await galleryService.update(gallery._id, {
        ...data,
        performerId: performer._id
      });
      message.success('Update gallery success.');
    } catch (e) {
      showError(e);
    } finally {
      setOnSubmit(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await photoService.remove(id);
      message.success('Removed!');
    } catch (e) {
      showError(e);
    }
  };

  return (
    <div className={style['performer-gallries-page']}>
      <PageTitle title={`Update gallery ${gallery?.name}`} />
      <PageHeader title="Update a Gallery" />
      <Form
        loading={onSubmit}
        performer={performer}
        onFinish={onFinish.bind(this)}
        gallery={gallery}
        remove={remove.bind(this)}
      />
    </div>
  );
}

UpdatePerformerGalleryPage.authenticate = true;
UpdatePerformerGalleryPage.layout = 'primary';

UpdatePerformerGalleryPage.getInitialProps = async (ctx) => {
  try {
    const {
      query: { data, id }
    } = ctx;
    if (typeof window !== 'undefined' && data) {
      return {
        gallery: JSON.parse(data)
      };
    }

    const { token } = nextCookie(ctx);
    const resp: IResponse<IPerformerGallery> = await galleryService.details(
      id,
      {
        Authorization: token
      }
    );
    return {
      gallery: resp.data
    };
  } catch {
    return redirect('/404', ctx);
  }
};

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(UpdatePerformerGalleryPage);
