import { getResponseError } from '@lib/utils';
import {
  addMyGalleries,
  getMyGalleries,
  removeMyGalleries
} from '@redux/performer/actions';
import {
  Button, message,
  Space
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  IDataResponse,
  IPerformerGallery,
  IResponse
} from 'src/interfaces';
import { galleryService, photoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const GalleriesGrid = dynamic(() => import('@components/galleries/gallery-dashboard-grid'), { ssr: false });

interface IProps {
  data: IPerformerGallery[];
  total: number;
  searching: boolean;
  success: boolean;
  getMyGalleries: Function;
  removeMyGalleries: Function;
  addMyGalleries: Function;
}

function PerformerPhotoPage({
  data,
  total,
  searching,
  success,
  getMyGalleries: dispatchGetMyGalleries,
  removeMyGalleries: dispatchRemoveMyGalleries,
  addMyGalleries: dispatchAddMyGalleries
}: IProps) {
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);

  const loadGalleries = () => {
    dispatchGetMyGalleries({ limit, offset });
  };

  useEffect(() => {
    loadGalleries();
  }, []);

  const showError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  const onRemove = async (id: string) => {
    try {
      await galleryService.remove(id);
      message.success('Removed!');
      dispatchRemoveMyGalleries(id);
    } catch (e) {
      showError(e);
    }
  };

  const addGalleries = async () => {
    try {
      const result = limit + offset;
      const resp: IResponse<IDataResponse<IPerformerGallery>> = await photoService.myPhotos({ limit, result });
      dispatchAddMyGalleries(resp.data.data);
      setOffset(result);
    } catch (e) {
      showError(e);
    }
  };

  const galleriesGridProps = {
    data,
    searching,
    success,
    total,
    hasMore: !searching && data.length < total,
    addGalleries: addGalleries.bind(this),
    remove: onRemove.bind(this),
    title: ''
  };

  return (
    <div className={style['performer-gallries-page']}>
      <PageTitle title="My galleries" />
      <PageHeader
        title="Galleries"
        extra={(
          <Space>
            <Button
              type="primary"
              onClick={() => Router.push('/account/performer/galleries/add')}
            >
              Add a new photo gallery
            </Button>
            <Button
              type="primary"
              onClick={() => Router.push('/account/performer/photos/add')}
            >
              Add a new photo
            </Button>
          </Space>
          )}
      />
      <GalleriesGrid {...galleriesGridProps} />
    </div>
  );
}

PerformerPhotoPage.authenticate = true;
PerformerPhotoPage.layout = 'primary';

const mapStateToProps = (state) => ({
  ...state.performer.assets.galleries
});
const mapDispatchs = {
  getMyGalleries,
  removeMyGalleries,
  addMyGalleries
};
export default connect(mapStateToProps, mapDispatchs)(PerformerPhotoPage);
