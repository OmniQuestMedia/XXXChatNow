import {
  CalendarOutlined,
  CrownOutlined,
  GlobalOutlined,
  HeartOutlined,
  LineChartOutlined,
  MessageOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  SettingOutlined,
  SolutionOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  EarningIcon,
  FundsIcon,
  GiftIcon,
  Group,
  MyProductIcon,
  PaymentTokensHistoryIcon,
  PayoutRequestIcon,
  PhotosIcon,
  PurchasedImageIcon,
  PurchasedItemIcon,
  PurchasedVideoIcon,
  TransactionHistoryIcon,
  VideosIcon
} from '@components/common/base/icons';
import Footer from '@components/common/layout/footer';
import Header from '@components/common/layout/header';
import SideMenu from '@components/common/layout/menu';
import NumberFormat from '@components/common/layout/numberformat';
import { currentUserSelector } from '@redux/selectors';
import { requestCurrency } from '@redux/settings/actions';
import {
  BackTop, Button, Col, Layout, Row, Space
} from 'antd';
import { useRouter } from 'next/router';
import Script from 'next/script';
import {
  ReactNode, useEffect, useRef
} from 'react';
import { isMobile } from 'react-device-detect';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import { converDuration } from 'src/lib';
import { loadUIValue } from 'src/redux/ui/actions';

import style from './primary-layout.module.less';

// import dynamic from 'next/dynamic';
// const SiderMenuNoSSR = dynamic(() => import('@components/common/layout/menu'), {
//   ssr: false
// });

const userSettingMenu = [
  {
    id: 'account-settings',
    name: 'Account Settings',
    route: '/account/user/account-settings',
    icon: <SettingOutlined />
  },
  {
    id: 'messages',
    name: 'Messages',
    route: '/messages',
    icon: <MessageOutlined />
  },
  {
    id: 'community_chat',
    name: 'Community Chat',
    route: '/community-chat',
    icon: <MessageOutlined />
  },
  {
    id: 'favorites',
    name: 'My favorites',
    route: '/account/user/favorites',
    icon: <HeartOutlined />
  },
  {
    id: 'funds-tokens',
    name: 'Funds / Tokens',
    route: '/account/user/funds-tokens',
    icon: (
      <span className={style.anticon}>
        <FundsIcon />
      </span>
    )
  },
  {
    id: 'transaction-history',
    name: 'Transaction History',
    route: '/account/user/transaction-history',
    icon: (
      <span className={style.anticon}>
        <TransactionHistoryIcon />
      </span>
    )
  },
  {
    id: 'payment-token-history',
    name: 'Payment Tokens History',
    route: '/account/user/payment-token-history',
    icon: (
      <span className={style.anticon}>
        <PaymentTokensHistoryIcon />
      </span>
    )
  },
  {
    id: 'order',
    name: 'My orders',
    route: '/account/user/orders',
    icon: <OrderedListOutlined />
  },
  {
    id: 'purchased-galleries',
    name: 'Purchased Galleries',
    route: '/account/user/purchased-gallery',
    icon: (
      <span className={style.anticon}>
        <PurchasedImageIcon />
      </span>
    )
  },
  {
    id: 'purchased-videos',
    name: 'Purchased Videos',
    route: '/account/user/purchased-video',
    icon: (
      <span className={style.anticon}>
        <PurchasedVideoIcon />
      </span>
    )
  },
  {
    id: 'purchased-products',
    name: 'Purchased Products',
    route: '/account/user/purchased-product',
    icon: (
      <span className={style.anticon}>
        <PurchasedItemIcon />
      </span>
    )
  },
  {
    id: 'referral',
    name: 'Referral',
    route: '/account/user/referral',
    icon: <GiftIcon />
  }
];

const performerSettingMenu = [
  {
    id: 'profile',
    name: 'Profile',
    route: '/account/performer/profile',
    icon: <UserOutlined />
  },
  {
    id: 'account-settings',
    name: 'Account Settings',
    route: '/account/performer/account-settings',
    icon: <SettingOutlined />
  },
  {
    id: 'account-watermerk',
    name: 'Watermark',
    route: '/account/performer/watermark',
    icon: <SettingOutlined />
  },
  {
    id: 'messages',
    name: 'Messages',
    route: '/messages',
    icon: <MessageOutlined />
  },
  {
    id: 'community-chat',
    name: 'Community Chat',
    route: '/community-chat',
    icon: <MessageOutlined />
  },
  {
    id: 'earning',
    name: 'Earnings',
    route: '/account/performer/earning',
    icon: (
      <span className={style.anticon}>
        <EarningIcon />
      </span>
    )
  },
  {
    id: 'transaction-history',
    name: 'Transaction History',
    route: '/account/performer/transaction-history',
    icon: (
      <span className={style.anticon}>
        <TransactionHistoryIcon />
      </span>
    )
  },
  {
    id: 'schedules',
    name: 'Schedules',
    route: '/account/performer/schedules',
    icon: <CalendarOutlined />
  },
  {
    id: 'scheduled-premium-live',
    name: 'Scheduled Premium Live',
    route: '/account/performer/my-scheduled-premium-live',
    icon: <CalendarOutlined />
  },
  {
    id: 'my-products',
    name: 'Products',
    route: '/account/performer/products',
    icon: (
      <span className={style.anticon}>
        <MyProductIcon />
      </span>
    )
  },
  {
    id: 'my-videos',
    name: 'Videos',
    route: '/account/performer/videos',
    icon: (
      <span className={style.anticon}>
        <VideosIcon />
      </span>
    )
  },
  {
    id: 'my-galleries',
    name: 'Galleries',
    route: '/account/performer/galleries',
    icon: (
      <span className={style.anticon}>
        <PhotosIcon />
      </span>
    )
  },
  {
    id: 'my-blocking',
    name: 'Blocking',
    route: '/account/performer/geo-block',
    icon: <GlobalOutlined />
  },
  {
    id: 'crowdfunding',
    name: 'My Crowdfunding',
    route: '/account/performer/crowdfunding',
    icon: <CrownOutlined />
  },
  {
    id: 'my-referral',
    name: 'My Referral',
    route: '/account/performer/referral',
    icon: <GiftIcon />
  },
  {
    id: 'payout-request',
    name: 'Payout Request',
    route: '/account/performer/payout-requests',
    icon: (
      <span className={style.anticon}>
        <PayoutRequestIcon />
      </span>
    )
  },
  {
    id: 'settings-wheel',
    name: 'Wheel Settings',
    route: '/account/performer/wheel',
    icon: <PieChartOutlined />
  },
  {
    id: 'order',
    name: 'Orders',
    route: '/account/performer/orders',
    icon: <OrderedListOutlined />
  }
];

const studioSettingMenu = (singularTextModel, pluralTextModel) => [
  {
    id: 'account-settings',
    name: 'Account Settings',
    route: '/studio/account-settings',
    icon: <SettingOutlined />
  },
  {
    id: 'earning',
    name: 'Earnings',
    route: '/studio/earning',
    icon: (
      <span className={style.anticon}>
        <EarningIcon />
      </span>
    )
  },
  {
    id: 'commission',
    name: `${singularTextModel} commissions`,
    route: '/studio/commissions',
    icon: <PieChartOutlined />
  },
  {
    id: 'studio-models',
    name: pluralTextModel,
    route: '/studio/models',
    icon: (
      <span className={style.anticon}>
        <Group />
      </span>
    )
  },
  {
    id: 'studio-payout-requests',
    name: 'My Payout request',
    route: '/studio/payout-requests',
    icon: (
      <span className={style.anticon}>
        <PayoutRequestIcon />
      </span>
    )
  },
  {
    id: 'studioperformer-requests',
    name: `${singularTextModel} Payout Requests`,
    route: '/studio/payout-requests/performer-requests',
    icon: <SolutionOutlined />
  },
  {
    id: 'performer-stats',
    name: `${singularTextModel} Stats`,
    route: '/studio/models/stats',
    icon: <LineChartOutlined />
  }
];

const mapStateToProps = (state: any) => ({
  ui: state.ui,
  totalUnreadMessage: state.message.totalUnreadMessage,
  singularTextModel: state.ui.singularTextModel,
  pluralTextModel: state.ui.pluralTextModel,
  currentUser: currentUserSelector(state)
});
const mapDispatchToProps = { dispatchLoadUIValue: loadUIValue };

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = {
  children: ReactNode;
};

function PrimaryLayout({
  children,
  currentUser,
  ui,
  totalUnreadMessage,
  singularTextModel = 'Performer',
  pluralTextModel = 'Performers',
  dispatchLoadUIValue
}: Props & PropsFromRedux) {
  const router = useRouter();
  const dispatch = useDispatch();

  const rightPrimaryLayoutRef = useRef<HTMLDivElement>(null);
  const onLive = () => {
    router.push({ pathname: '/live' }, `/live/lovense/${currentUser.username}`);
  };

  const onRouteChangeStart = () => {
    if (isMobile && rightPrimaryLayoutRef.current instanceof HTMLDivElement) {
      const container = document.querySelector('.container');
      const rect = rightPrimaryLayoutRef.current.getBoundingClientRect();
      if (container) {
        container.scroll({ top: rect.top, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    dispatchLoadUIValue();
    onRouteChangeStart();
    dispatch(requestCurrency());

    router.events.on('routeChangeStart', onRouteChangeStart);
    return () => {
      router.events.off('routeChangeStart', onRouteChangeStart);
    };
  }, []);

  const { fixedHeader } = ui;

  return (
    <Layout>
      <link
        href="https://unpkg.com/video.js@7.8.3/dist/video-js.css"
        rel="stylesheet"
      />
      <Script src="https://unpkg.com/video.js@7.8.3/dist/video.js" />
      <Script src="https://unpkg.com/@videojs/http-streaming@1.13.3/dist/videojs-http-streaming.js" />
      <Script src="/lib/adapter-latest.js" />
      <Script src="/lib/webrtc_adaptor.js" />
      <div
        className="container"
        style={{ paddingTop: fixedHeader ? 72 : 0 }}
        id="primaryLayout"
      >
        <Header />
        <Layout.Content className="content">
          <div className={style['primary-content']}>
            <Row gutter={10}>
              <Col xs={24} sm={4}>
                {currentUser?.role === 'performer' && (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentUser.verified && (
                      <Button
                        type="primary"
                        className={style['btn-live']}
                        onClick={onLive}
                      >
                        Live Room
                      </Button>
                    )}
                    <SideMenu
                      menus={performerSettingMenu}
                      totalUnreadMessage={totalUnreadMessage}
                    />
                  </Space>
                )}
                {currentUser?.role === 'user' && (
                  <SideMenu
                    menus={userSettingMenu}
                    totalUnreadMessage={totalUnreadMessage}
                  />
                )}
                {currentUser?.role === 'studio' && (
                  <>
                    <div className={style['tk-studio']}>
                      <div className={style.stat}>
                        <span>Total models</span>
                        <span>{currentUser.stats.totalPerformer || 0}</span>
                      </div>
                      <div className={style.stat}>
                        <span>Total earned</span>
                        <span>
                          <NumberFormat
                            value={currentUser.stats.totalTokenEarned || 0}
                          />
                        </span>
                      </div>
                      <div className={style.stat}>
                        <span>Total sessions</span>
                        <span>{currentUser.stats.totalOnlineToday || 0}</span>
                      </div>
                      <div className={style.stat}>
                        <span>Total hours online</span>
                        <span>
                          {currentUser.stats.totalHoursOnline
                            && converDuration(
                              currentUser.stats.totalHoursOnline
                            )}
                        </span>
                      </div>
                    </div>
                    <SideMenu
                      menus={studioSettingMenu(singularTextModel, pluralTextModel)}
                    // totalUnreadMessage={totalUnreadMessage}
                    />
                  </>
                )}
              </Col>
              <Col
                xs={24}
                sm={20}
                className={style['right-primary-layout']}
                ref={rightPrimaryLayoutRef}
              >
                {children}
              </Col>
            </Row>
          </div>
        </Layout.Content>
        <Footer />
        <BackTop
          className={style.backTop}
          target={() => document.querySelector('#primaryLayout') as HTMLElement}
        />
      </div>
    </Layout>
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryLayout);
