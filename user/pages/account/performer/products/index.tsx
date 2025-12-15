import { getResponseError, getSearchData } from '@lib/utils';
import { getMyProducts, removeMyProduct } from '@redux/performer/actions';
import { performerService } from '@services/perfomer.service';
import { Button, message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IProduct } from 'src/interfaces';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const ProductsTable = dynamic(() => import('@components/products/products-table'), { ssr: false });

interface IProps {
  data: IProduct[];
  total: number;
  searching: boolean;
  getMyProducts: Function;
  removeMyProduct: Function;
}

function PerformerProductsPage({
  data,
  total,
  searching,
  getMyProducts: dispatchGetMyProducts,
  removeMyProduct: dispatchRemoveMyProduct
}: IProps) {
  const [query, setQuery] = useState({
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc',
    filter: {}
  });

  useEffect(() => {
    dispatchGetMyProducts(query);
  }, []);

  useEffect(() => {
    dispatchGetMyProducts(query);
  }, [query]);

  const onChange = (pagination, filters, sorter) => {
    setQuery(getSearchData(pagination, filters, sorter, query));
  };

  const onRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return false;
    }

    try {
      await performerService.removeProduct(id);
      message.success('Removed!');
      dispatchRemoveMyProduct(id);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
    return {};
  };

  return (
    <div className={style['performer-products-page']}>
      <PageTitle title="My products" />
      <div className={style['ant-page-header']}>
        <PageHeader
          title="My Product"
          extra={(
            <Button
              type="primary"
              onClick={() => Router.push('/account/performer/products/add')}
            >
              Add new Product
            </Button>
            )}
        />

      </div>
      <ProductsTable
        products={data}
        searching={searching}
        total={total}
        onChange={onChange.bind(this)}
        pageSize={query.limit}
        remove={onRemove.bind(this)}
      />
    </div>
  );
}

PerformerProductsPage.authenticate = true;
PerformerProductsPage.layout = 'primary';

const mapStateToProps = (state) => ({
  ...state.performer.assets.products
});
const mapDispatch = { getMyProducts, removeMyProduct };
export default connect(mapStateToProps, mapDispatch)(PerformerProductsPage);
