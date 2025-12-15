import { getResponseError, redirect } from '@lib/utils';
import { IResponse } from '@services/api-request';
import { performerService } from '@services/perfomer.service';
import { productService } from '@services/product.service';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import nextCookie from 'next-cookies';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IProduct } from 'src/interfaces';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const ProductForm = dynamic(() => import('@components/products/products-form'), { ssr: false });

interface IProps {
  performer: IPerformer;
  product: IProduct;
}

function PerformerProductsPage({
  performer,
  product
}: IProps) {
  const [onSubmit, setOnSubmit] = useState(false);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await performerService.updateProduct(
        `/performer/performer-assets/products/${product._id}`,
        { ...data, performerId: performer._id }
      );
      message.success('Update product success.');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };
  return (
    <div className={style['performer-products-page']}>
      <PageTitle title={`Update product - ${product.name}`} />
      <PageHeader title="Update Product" />
      <ProductForm
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        product={product}
      />
    </div>
  );
}

PerformerProductsPage.authenticate = true;
PerformerProductsPage.layout = 'primary';
PerformerProductsPage.getInitialProps = async (ctx) => {
  try {
    const {
      query: { product, id }
    } = ctx;
    if (typeof window !== 'undefined' && product) {
      return {
        product: JSON.parse(product)
      };
    }

    const { token } = nextCookie(ctx);
    const resp: IResponse<IProduct> = await productService.details(id, {
      Authorization: token
    });
    return {
      product: resp.data
    };
  } catch (e) {
    return redirect('/404', ctx);
  }
};

const mapStateToProps = (state) => ({
  performer: state.performer.current
});
export default connect(mapStateToProps)(PerformerProductsPage);
