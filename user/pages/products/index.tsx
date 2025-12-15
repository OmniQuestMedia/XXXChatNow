import SeoMetaHead from '@components/common/seo-meta-head';
import { capitalizeFirstLetter } from '@lib/string';
import { getResponseError, redirect } from '@lib/utils';
import {
  getPerformerProducts,
  loadMorePerformerProduct,
  purchaseProductSuccess
} from '@redux/products/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Alert, Col,
  message, Row
} from 'antd';
import dynamic from 'next/dynamic';
import { NextRouter, withRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { connect } from 'react-redux';
import ModalBuyAssets from 'src/components/performer-assets/common/modal-buy-assets';
import {
  IDataResponse,
  IPerformer,
  IProduct,
  IResponse,
  ITransaction
} from 'src/interfaces';
import { performerService, productService } from 'src/services';

const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const ProductCard = dynamic(() => import('src/components/products/product-card'));

interface IProps {
  router: NextRouter;
  performer: IPerformer;
  getPerformerProducts: Function;
  loadMorePerformerProduct: Function;
  updateCurrentUserBalance: Function;
  purchaseProductSuccess: Function;
  loggedIn: boolean;
  data: IProduct[];
  total: number;
  searching: boolean;
  success: boolean;
  ids: string[];
  singularTextModel: string;
}

function ProductsPage({
  router: { query },
  performer,
  getPerformerProducts: dispatchGetPerformerProducts,
  loadMorePerformerProduct: dispatchLoadMorePerformerProduct,
  updateCurrentUserBalance: dispatchUpdateCurrentUserBalance,
  purchaseProductSuccess: dispatchPurchaseProductSuccess,
  data,
  total,
  searching,
  success,
  ids,
  loggedIn,
  singularTextModel = 'Performer'
}: IProps) {
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);
  const testRef = useRef(null);
  const hasMore = ids.length < total;
  const username = performer && performer.username;

  const getProducts = async () => {
    const performerId = performer ? performer._id : '';
    await dispatchGetPerformerProducts({
      ...query,
      limit,
      offset,
      performerId
    });
  };

  useEffect(() => {
    getProducts();
  }, []);

  const onPurchaseSuccess = (dt: IResponse<ITransaction>, id: string) => {
    dispatchUpdateCurrentUserBalance(-dt.data.totalPrice);
    dispatchPurchaseProductSuccess(id);
    message.success(`Successfully purchased ${dt.data.type} with ${dt.data.totalPrice} tokens`);
  };

  const infinityScroll = async () => {
    try {
      const result = limit + offset;
      const performerId = performer ? performer._id : '';
      const resp: IResponse<IDataResponse<IProduct>> = await productService.search({
        ...query,
        limit,
        offset: result,
        performerId
      });
      dispatchLoadMorePerformerProduct(resp.data.data);
      setOffset(result);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  const purchase = (item: IProduct) => {
    if (item.type === 'digital' && item.isBought) {
      return message.success('You have bought this product, please check your email to get link.');
    }
    testRef.current.showModalBuyAssets(item, 'product');
    return {};
  };

  return (
    <div className="main-container">
      <SeoMetaHead
        pageTitle={username ? `${capitalizeFirstLetter(username)}'s Products` : 'Products'}
        canonical={`/photos/?username=${username}`}
      />
      <PageHeader title={username ? `${capitalizeFirstLetter(username)}'s Products` : 'Products'} />
      {success && (
        <div className="products-page">
          {query.username && !performer && (
            <Alert message={`${singularTextModel} not found.`} banner />
          )}
          {searching ? (
            <p>Loading...</p>
          ) : (
            <InfiniteScroll
              loadMore={infinityScroll.bind(this)}
              hasMore={hasMore}
              loader={<p>Loading...</p>}
            >
              <Row gutter={20}>
                {ids && ids.length > 0 ? (
                  ids.map((id) => (
                    <Col xl={4} md={6} sm={12} xs={12} key={id}>
                      <ProductCard
                        product={data[id]}
                        onHandlePurchase={purchase.bind(this)}
                      />
                    </Col>
                  ))
                ) : (
                  <p className="no-items-found">No product found.</p>
                )}
              </Row>
            </InfiniteScroll>
          )}
        </div>
      )}
      <ModalBuyAssets
        ref={testRef}
        loggedIn={loggedIn}
        updateCurrentUserBalance={updateCurrentUserBalance}
        onSucess={onPurchaseSuccess.bind(this)}
      />
    </div>
  );
}

ProductsPage.getInitialProps = async (ctx) => {
  const { query } = ctx;
  try {
    if (query.performer) {
      return {
        performer: JSON.parse(query.performer)
      };
    }
    if (query.username) {
      const resp = await performerService.details(query.username);
      return {
        performer: resp.data
      };
    }

    return {};
  } catch (error) {
    return redirect('/404', ctx);
  }
};

const mapStates = (state) => ({
  ...state.product,
  singularTextModel: state.ui.singularTextModel,
  loggedIn: state.auth.loggedIn
});

const mapDispatch = {
  getPerformerProducts,
  loadMorePerformerProduct,
  updateCurrentUserBalance,
  purchaseProductSuccess
};
export default withRouter(connect(mapStates, mapDispatch)(ProductsPage));
