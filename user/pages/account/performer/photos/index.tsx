import { getResponseError } from '@lib/utils';
import {
  addMyPhotos,
  getMyPhotos,
  removeMyPhoto
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
  IPhoto, IResponse
} from 'src/interfaces';
import { photoService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PhotoGrid = dynamic(() => import('@components/photos/photo-dashboard-grid'), { ssr: false });

interface IProps {
  data: IPhoto[];
  total: number;
  searching: boolean;
  success: boolean;
  getMyPhotos: Function;
  removeMyPhoto: Function;
  addMyPhotos: Function;
}

function PerformerPhotoPage({
  data,
  total,
  searching,
  success,
  getMyPhotos: dispatchGetMyPhotos,
  removeMyPhoto: dispatchRemoveMyPhoto,
  addMyPhotos: dispatchAddMyPhotos
}: IProps) {
  const [query, setQuery] = useState({
    limit: 12,
    offset: 0
  });

  const loadPhotos = () => {
    dispatchGetMyPhotos(query);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const showError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  const onRemove = async (id: string) => {
    try {
      await photoService.remove(id);
      message.success('Removed!');
      dispatchRemoveMyPhoto(id);
    } catch (e) {
      showError(e);
    }
  };

  const addPhotos = async () => {
    try {
      const offset = query.limit + query.offset;
      const resp: IResponse<IDataResponse<IPhoto>> = await photoService.myPhotos({ query, offset });
      dispatchAddMyPhotos(resp.data.data);
      setQuery({ limit: query.limit, offset });
    } catch (e) {
      showError(e);
    }
  };

  const photoGridProps = {
    data,
    searching,
    success,
    total,
    hasMore: !searching && data.length < total,
    addPhotos: addPhotos.bind(this),
    remove: onRemove.bind(this),
    title: ''
  };
  return (
    <div className={style['performer-photos-page']}>
      <PageTitle title="My photos" />
      <PageHeader
        title="Photos"
        extra={(
          <Space>
            <Button type="primary" onClick={() => Router.push('/account/performer/galleries/add')}>
              Add a new gallery
            </Button>
            <Button type="primary" onClick={() => Router.push('/account/performer/photos/add')}>
              Add new photos
            </Button>
          </Space>
          )}
      />
      <PhotoGrid {...photoGridProps} />
    </div>
  );
}

PerformerPhotoPage.authenticate = true;
PerformerPhotoPage.layout = 'primary';

const mapStateToProps = (state) => ({
  ...state.performer.assets.photos
});
const mapDispatchs = { getMyPhotos, removeMyPhoto, addMyPhotos };
export default connect(mapStateToProps, mapDispatchs)(PerformerPhotoPage);
