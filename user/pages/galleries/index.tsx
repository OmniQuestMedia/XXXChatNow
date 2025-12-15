import { getResponseError, redirect } from '@lib/utils';
import {
  addPerformerGalleries,
  getPerformerGalleries,
  purchaseGallerySuccess
} from '@redux/galleries/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Alert, Col,
  message, Row
} from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { connect } from 'react-redux';
import ModalBuyAssets from 'src/components/performer-assets/common/modal-buy-assets';
import {
  IPerformer,
  IPerformerGallery,
  IResponse,
  ITransaction
} from 'src/interfaces';
import { galleryService, performerService } from 'src/services';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const GalleryCard = dynamic(() => import('@components/galleries/gallery-card'), { ssr: false });

interface IProps {
  performer: IPerformer;
  data: IPerformerGallery[];
  total: number;
  success: boolean;
  searching: boolean;
  ids: string[];
  getPerformerGalleries: Function;
  purchaseGallerySuccess: Function;
  addPerformerGalleries: Function;
  loggedIn: boolean;
  updateCurrentUserBalance: Function;
  singularTextModel: string;
}

let modalRef: any;

function GalleriesPage({
  performer,
  data,
  total,
  success,
  searching,
  ids,
  loggedIn,
  singularTextModel = 'Performer',
  getPerformerGalleries: dispatchGetPerformerGalleries,
  purchaseGallerySuccess: dispatchPurchaseGallerySuccess,
  addPerformerGalleries: dispatchAddPerformerGalleries,
  updateCurrentUserBalance: dispatchUpdateCurrentUserBalance
}: IProps) {
  const router = useRouter();
  const hasMore = ids.length < total;
  const [limit] = useState(60);
  const [offset, setOffset] = useState(0);

  const getGalleries = async () => {
    try {
      const performerId = performer ? performer._id : '';
      dispatchGetPerformerGalleries({
        limit,
        offset,
        ...router.query,
        performerId
      });
    } catch (error) {
      const err = await Promise.resolve(error);
      message.error(getResponseError(err));
    }
  };

  useEffect(() => {
    getGalleries();
  }, []);

  const onPurchaseSuccess = (val: IResponse<ITransaction>, id: string) => {
    // dispatchUpdateCurrentUserBalance(-val.data.totalPrice);
    dispatchPurchaseGallerySuccess(id);
  };

  const loadMore = async () => {
    try {
      const performerId = performer ? performer._id : '';
      const resp = await galleryService.search(
        {
          ...router.query,
          performerId,
          limit,
          offset: limit + offset
        },
        false
      );
      dispatchAddPerformerGalleries(resp.data.data);
      setOffset(limit + offset);
    } catch (error) {
      const err = await Promise.resolve(error);
      message.error(getResponseError(err));
    }
  };

  const purchase = (item: IPerformerGallery) => {
    if (item.isBought) {
      return router.push(
        {
          pathname: '/photos',
          query: {
            data: JSON.stringify(item),
            id: item._id
          }
        },
        `/photos/${item._id}`
      );
    }
    modalRef.showModalBuyAssets(item, 'gallery');
    return {};
  };

  const setRef = (refFunction) => {
    modalRef = refFunction;
  };

  return (
    <div className="main-container">
      <PageTitle title={`${performer?.username} Galleries`} />
      <PageHeader
        title={`${performer?.username ? `${performer?.username}'s ` : ''}
          Galleries`}
      />
      {router.query.username && !performer && (
        <Alert message={`${singularTextModel} not found.`} banner />
      )}
      <div className="galleries-page">
        {searching ? (
          <p>Loading...</p>
        ) : success ? (
          <InfiniteScroll
            loadMore={loadMore.bind(this)}
            hasMore={hasMore}
            loader={<p>Loading...</p>}
          >
            <Row gutter={20}>
              {ids && ids.length > 0 ? (
                ids.map(
                  (id) => data[id].numOfItems > 0 && (
                    <Col xl={4} md={6} sm={12} xs={12} key={id}>
                      <GalleryCard
                        gallery={data[id]}
                        onHandlePurchase={purchase.bind(this)}
                      />
                    </Col>
                  )
                )
              ) : (
                <p className="no-items-found">No gallery found.</p>
              )}
            </Row>
          </InfiniteScroll>
        ) : (
          <p>Server error</p>
        )}
      </div>
      <ModalBuyAssets
        // eslint-disable-next-line no-return-assign
        ref={(ref) => setRef(ref)}
        loggedIn={loggedIn}
        onSucess={onPurchaseSuccess.bind(this)}
        updateCurrentUserBalance={dispatchUpdateCurrentUserBalance}
      />
    </div>
  );
}

GalleriesPage.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    if (query.performer) {
      return { performer: JSON.parse(query.performer) };
    }
    if (query.username) {
      const resp = await performerService.details(query.username);
      return { performer: resp.data };
    }

    return {};
  } catch (error) {
    return redirect('/404', ctx);
  }
};

const mapStates = (state) => ({
  ...state.galleries,
  loggedIn: state.auth.loggedIn,
  singularTextModel: state.ui.singularTextModel
});
const mapDispatchs = {
  getPerformerGalleries,
  addPerformerGalleries,
  updateCurrentUserBalance,
  purchaseGallerySuccess
};

export default connect(mapStates, mapDispatchs)(GalleriesPage);
