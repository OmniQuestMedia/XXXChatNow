import SeoMetaHead from '@components/common/seo-meta-head';
import PerformerCarousel from '@components/performer/performer-carousel';
import ProfileCard from '@components/performer/profile-card';
import ModalBuyAssets from '@components/performer-assets/common/modal-buy-assets';
import PerformerGallery from '@components/performer-assets/gallery-carousel';
import PerformerProduct from '@components/performer-assets/product-carousel';
import PerformerVideo from '@components/performer-assets/video-carousel';
import Header from '@components/streaming/header';
import { redirect } from '@lib/utils';
import {
  getPerformerDetails,
  updatePerformerAsset
} from '@redux/performer/actions';
import { currentUserSelector } from '@redux/selectors';
import {
  getStreamConversationSuccess,
  loadStreamMessages,
  receiveStreamMessageSuccess,
  resetAllStreamMessage,
  resetStreamMessage
} from '@redux/stream-chat/actions';
import { updateActivePerformer } from '@redux/streaming/actions';
import { updateCurrentUserBalance } from '@redux/user/actions';
import {
  Col, message,
  Row
} from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import nextCookie from 'next-cookies';
import {
  useEffect, useRef
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  IPerformer,
  IPerformerGallery,
  IProduct,
  IUser,
  IVideo
} from 'src/interfaces';
import { performerService } from 'src/services';
import { IResponse } from 'src/services/api-request';

import style from './profile.module.less';

// TODO - recheck if need ssr. it is optimize for load, this page is big
const PublicStreamViewerWithChatbox = dynamic(() => import('@components/streaming/public-stream-viewer-with-chatbox'), {
  ssr: true
});

// eslint-disable-next-line no-shadow
enum PERFORMER_ASSETS_TYPE {
  PRODUCT = 'product',
  GALLERY = 'gallery',
  VIDEO = 'video'
}

const mapStates = (state) => ({
  details: state.performer.performerDetails,
  hideBio: state.ui.hideBio,
  user: currentUserSelector(state),
  loggedIn: state.auth.loggedIn,
  activeConversation: state.streamMessage.activeConversation,
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl,
  singularTextModel: state.ui.singularTextModel,
  siteName: state.ui.siteName
});

const mapDispatch = {
  loadStreamMessages,
  getStreamConversationSuccess,
  receiveStreamMessageSuccess,
  resetStreamMessage,
  resetAllStreamMessage,
  dispatchUpdateCurrentUserBalance: updateCurrentUserBalance,
  dispatchGetPerformerDetail: getPerformerDetails,
  dispatchUpdatePerformerAsset: updatePerformerAsset,
  dispatchActivePerformer: updateActivePerformer
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

type IProps = {
  user: IUser;
  loggedIn: boolean;
  performer: IPerformer;
  searching: boolean;
  products: Record<string, IProduct>;
  videos: Record<string, IVideo>;
  galleries: Record<string, IPerformerGallery>;
  placeholderAvatarUrl: string;
};
function ProfilePage({
  loggedIn,
  performer,
  user,
  details,
  siteName,
  placeholderAvatarUrl,
  dispatchGetPerformerDetail,
  hideBio,
  singularTextModel = 'Performer',
  dispatchActivePerformer,
  dispatchUpdatePerformerAsset,
  dispatchUpdateCurrentUserBalance
}: IProps & PropsFromRedux) {
  const router = useRouter();
  const buyAssetsRef = useRef(null);

  const increaseView = async () => {
    try {
      await performerService.increaseView(performer._id);
      // eslint-disable-next-line no-empty
    } catch { }
  };

  const onBoughtAssetSuccess = (type, id, payload) => {
    dispatchUpdatePerformerAsset({ type, id, payload });
  };

  const showAssetToBuy = async (type: PERFORMER_ASSETS_TYPE, item) => {
    const {
      isBought,
      isSale,
      name,
      type: itemType
    } = item;
    switch (type) {
      case 'gallery':
        if (isBought || !isSale) {
          router.push(
            {
              pathname: '/photos',
              query: {
                data: JSON.stringify(item),
                id: item._id
              }
            },
            `/photos/${item._id}`
          );
          return;
        }
        break;
      case 'product':
        if (isBought && itemType === 'digital') {
          message.info(
            `You have purchased ${name} already. Please check your email!`
          );
          return;
        }
        break;
      default:
        break;
    }
    buyAssetsRef.current.showModalBuyAssets(item, type);
  };

  useEffect(() => {
    if (user && user.role === 'performer') {
      router.push('/live');
      return;
    }

    if (user && user.role === 'studio') {
      router.push('/studio/account-settings');
      return;
    }

    if (performer.streamingStatus === 'private') {
      message.error(`${singularTextModel} is streaming private, please connect after some time`);
    }

    increaseView();
    dispatchGetPerformerDetail(performer);
    dispatchActivePerformer(performer);
  }, [performer._id]);

  let metaDesc = performer.metaDescription || `Experience live webcam broadcasts from amateur models worldwide without charge on ${siteName} ! - Sign up for free today!`;

  if (performer.streamingStatus !== 'offline' && performer.streamingTitle) {
    metaDesc = performer.streamingTitle;
  }

  return (
    <div>
      <SeoMetaHead
        item={performer}
        canonical={`/profile/${performer.username}`}
        description={metaDesc}
        pageTitle={performer.metaTitle || `Watch ${performer.username} live cam on ${siteName}`}
        keywords={performer.metaKeyword}
      />
      <ModalBuyAssets
        ref={buyAssetsRef}
        onSucess={onBoughtAssetSuccess}
        loggedIn={loggedIn}
        updateCurrentUserBalance={dispatchUpdateCurrentUserBalance}
      />

      <Header performer={performer} />

      {/* <Suspense fallback={<Skeleton loading paragraph rows={4} />}> */}
      <PublicStreamViewerWithChatbox
        performer={performer}
      />
      {/* </Suspense> */}
      <div hidden={hideBio} className={style['info-profile']}>
        <Row
          gutter={[
            { sm: 25, xs: 0 },
            { sm: 10, xs: 25 }
          ]}
        >
          <Col xs={{ span: 24 }} lg={{ span: 8 }}>
            <ProfileCard
              placeholderAvatarUrl={placeholderAvatarUrl}
              performer={performer}
            />
          </Col>
          <Col xs={{ span: 24 }} lg={{ span: 16 }}>
            <PerformerProduct
              performer={performer}
              products={Object.values(details.products || {})}
              searching={details.searching}
              purchaseProduct={showAssetToBuy.bind(this, 'product')}
            />
            <PerformerVideo
              performer={performer}
              videos={Object.values(details.videos || {})}
              searching={details.searching}
            />
            <PerformerGallery
              performer={performer}
              galleries={Object.values(details.galleries || {})}
              searching={details.searching}
              purchaseGallery={showAssetToBuy.bind(this, 'gallery')}
            />
            <PerformerCarousel
              performers={details.data?.relatedPerformers || []}
              searching={details.searching}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}

ProfilePage.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const { token } = nextCookie(ctx);
    const headers = { Authorization: token || '' };
    const resp: IResponse<IPerformer> = await performerService.details(
      query.username,
      headers
    );
    const performer = resp.data;
    if (performer.isBlocked) {
      redirect('/', ctx);
    }

    return {
      performer
    };
  } catch (e) {
    redirect('/404', ctx);
    return null;
  }
};
ProfilePage.layout = 'stream';
export default connector(ProfilePage);
