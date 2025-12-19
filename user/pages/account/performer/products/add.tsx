import { getResponseError } from '@lib/utils';
import { performerService } from '@services/perfomer.service';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer } from 'src/interfaces';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const ProductForm = dynamic(() => import('@components/products/products-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
}

function CreatePerformerProductsPage({
  performer
}: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await performerService.createProduct(
        '/performer/performer-assets/products',
        { ...data, performerId: performer._id }
      );
      message.success('Add product success.');
      Router.back();
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };
  return (
    <div className={style['performer-products-page']}>
      <PageTitle title="New product" />
      <PageHeader title="Create new Product" />
      <ProductForm loading={onSubmit} product={{}} onFinish={onFinish.bind(this)} />
    </div>
  );
}

CreatePerformerProductsPage.authenticate = true;
CreatePerformerProductsPage.layout = 'primary';

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(CreatePerformerProductsPage);
