import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer } from 'src/interfaces';
import { galleryService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Form = dynamic(() => import('@components/photos/gallery-form'), {
  ssr: false
});

interface IProps {
  performer: IPerformer;
}

function CreatePerformerGalleryPage({
  performer
}: IProps) {
  const router = useRouter();
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await galleryService.create({
        ...data,
        performerId: performer._id,
        token: parseInt(data.token, 10)
      });
      message.success('Created gallery successfully.');
      router.back();
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };

  return (
    <div className={style['performer-gallries-page']}>
      <PageTitle title="New gallery" />
      <PageHeader title="Create new Gallery" />
      <Form
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        gallery={{}}
      />
    </div>
  );
}

CreatePerformerGalleryPage.authenticate = true;
CreatePerformerGalleryPage.layout = 'primary';

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(CreatePerformerGalleryPage);
