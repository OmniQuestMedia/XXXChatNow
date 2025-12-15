import {
  BankFilled,
  BankOutlined,
  CameraOutlined,
  ContainerOutlined,
  DollarOutlined,
  FileImageOutlined,
  HeatMapOutlined,
  MailOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  SkinOutlined,
  SoundOutlined,
  TagsOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  VideoCameraOutlined,
  WalletOutlined,
  WomanOutlined
} from '@ant-design/icons';
import Loader from '@components/common/base/loader';
import Header from '@components/common/layout/header';
import Sider from '@components/common/layout/sider';
import { BackTop, Layout } from 'antd';
import { enquireScreen, unenquireScreen } from 'enquire-js';
import { Router } from 'next/router';
import {
  useEffect, useRef, useState
} from 'react';
import { connect } from 'react-redux';
import { IUIConfig } from 'src/interfaces/ui-config';
import { loadUIValue, updateUIValue } from 'src/redux/ui/actions';

import style from './primary-layout.module.less';

interface IPrimaryLayout {
  children: any;
  config: IUIConfig;
  updateUIHandler: Function;
  loadUIHandler: Function;
  ui: any;
}

function PrimaryLayout({
  children,
  updateUIHandler,
  loadUIHandler,
  ui
}: IPrimaryLayout) {
  const [isMobile, setIsMobile] = useState(false);
  const [routerChange, setRouterChange] = useState(false);
  const [collapsed, setCollapsed] = useState(ui.collapsed);

  const enquireHandler = useRef(null);

  const handleStateChange = () => {
    Router.events.on('routeChangeStart', async () => setRouterChange(true));
    Router.events.on('routeChangeComplete', async () => setRouterChange(false));
  };

  const onThemeChange = (theme: string) => {
    updateUIHandler({ theme });
  };

  const onCollapseChange = (c) => {
    setCollapsed(c);
    updateUIHandler({ collapsed: c });
  };

  useEffect(() => {
    loadUIHandler();
    enquireHandler.current = enquireScreen((mobile) => {
      if (isMobile !== mobile) {
        setIsMobile(mobile);

        if (mobile) {
          setCollapsed(true);
        }
      }
    });

    handleStateChange();

    return () => {
      unenquireScreen(enquireHandler.current);
    };
  }, []);

  const {
    fixedHeader, logo, siteName, theme
  } = ui;
  const headerProps = {
    collapsed,
    theme,
    onCollapseChange
  };
  const sliderMenus = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <PieChartOutlined />,
      children: [
        {
          key: 'stats',
          label: 'Statistic',
          route: '/dashboard'
        }
      ]
    },
    {
      key: 'leader-board',
      label: 'Leader Board',
      icon: <OrderedListOutlined />,
      children: [
        {
          key: 'leader-board-listing',
          label: 'Listing',
          route: '/leader-board'
        }
        // {
        //   key: 'leader-board-create',
        //   label: 'Create',
        //   route: '/leader-board/create'
        // }
      ]
    },
    {
      key: 'posts',
      label: 'Static Pages',
      icon: <ContainerOutlined />,
      children: [
        {
          key: 'post-page',
          label: 'Page',
          route: '/posts?type=page'
        },
        {
          key: 'page-create',
          label: 'Create page',
          route: '/posts/create?type=page'
        }
      ]
    },
    {
      key: 'menu',
      label: 'FE Menu',
      icon: <MenuOutlined />,
      children: [
        {
          key: 'menu-listing',
          label: 'Existing menu options',
          route: '/menu'
        },
        {
          label: 'Create',
          key: 'create-menu',
          route: '/menu/create'
        }
      ]
    },
    {
      key: 'banner',
      label: 'Banners',
      icon: <FileImageOutlined />,
      children: [
        {
          key: 'banner-listing',
          label: 'Existing Banners',
          route: '/banner'
        },
        {
          label: 'Upload',
          key: 'upload-banner',
          route: '/banner/upload'
        }
      ]
    },
    {
      key: 'email-template',
      label: 'Email templates',
      icon: <MailOutlined />,
      children: [
        {
          key: 'email-listing',
          label: 'List',
          route: '/email-templates'
        }
      ]
    },
    {
      key: 'studio',
      label: 'Studios',
      icon: <WalletOutlined />,
      children: [
        {
          label: 'List Studios',
          key: 'studios-listing',
          route: '/studios'
        },
        {
          label: 'Pending Studios',
          key: 'pending-studios',
          route: '/studios?status=pending'
        },
        {
          label: 'Create',
          key: 'studios-create',
          route: '/studios/create'
        }
      ]
    },
    {
      key: 'accounts',
      label: 'Users',
      icon: <UserOutlined />,
      children: [
        {
          label: 'User list',
          key: 'users',
          route: '/users'
        },
        {
          label: 'Create',
          key: 'users-create',
          route: '/users/create'
        }
      ]
    },
    {
      key: 'performer',
      label: 'Performers',
      icon: <WomanOutlined />,
      children: [
        {
          label: 'Current categories',
          key: 'performer-categories',
          route: '/performer/category'
        },
        {
          label: 'All Performers',
          key: 'performers',
          route: '/performer'
        },
        {
          label: 'Online Performers',
          key: 'online-performers',
          route: '/performer/online'
        },
        {
          label: 'Pending Performers',
          key: 'pending-performers',
          route: '/performer?status=pending'
        },
        {
          label: 'Create New',
          key: 'create-performers',
          route: '/performer/create'
        }
      ]
    },
    {
      key: 'performers-photos',
      label: 'Photos',
      icon: <CameraOutlined />,
      children: [
        {
          key: 'photo-listing',
          label: 'Photos',
          route: '/photos'
        },
        {
          label: 'Upload',
          key: 'upload-photo',
          route: '/photos/upload'
        },
        {
          label: 'Bulk Upload',
          key: 'bulk-upload-photo',
          route: '/photos/bulk-upload'
        },
        {
          key: 'gallery-listing',
          label: 'Existing galleries',
          route: '/gallery'
        },
        {
          label: 'Create galleries',
          key: 'create-galleries',
          route: '/gallery/create'
        }
      ]
    },
    {
      key: 'performers-products',
      label: 'Products',
      icon: <SkinOutlined />,
      children: [
        {
          key: 'product-listing',
          label: 'Inventory',
          route: '/product'
        },
        {
          label: 'Create',
          key: 'create-product',
          route: '/product/create'
        }
      ]
    },
    {
      key: 'videos',
      label: 'Videos',
      icon: <VideoCameraOutlined />,
      children: [
        {
          key: 'video-listing',
          label: 'Existing videos',
          route: '/video'
        },
        {
          key: 'video-upload',
          label: 'Upload',
          route: '/video/upload'
        }
      ]
    },
    {
      key: 'tokens',
      label: 'Token Packages',
      icon: <BankOutlined />,
      children: [
        {
          key: 'token-listing',
          label: 'Token Packages',
          route: '/token-package'
        },
        {
          key: 'create-token',
          label: 'Create',
          route: '/token-package/create'
        }
      ]
    },
    {
      key: 'featured-creator-package',
      label: 'Featured creator package',
      icon: <TagsOutlined />,
      children: [
        {
          key: 'featured-creator-booking-listing',
          label: 'Featured Creator Booking',
          route: '/featured-creator-package/booking'
        },
        {
          key: 'featured-creator-booking-status',
          label: 'Featured Creator Approved',
          route: '/featured-creator-package/booking-status'
        },
        {
          key: 'featured-creator-package-listing',
          label: 'Listing',
          route: '/featured-creator-package'
        },
        {
          key: 'create-featured-creator-package',
          label: 'Create',
          route: '/featured-creator-package/create'
        }
      ]
    },
    {
      key: 'earning',
      label: 'Earnings log',
      icon: <DollarOutlined />,
      children: [
        {
          key: 'earning-listing-performer',
          label: 'Performer Earnings',
          route: '/earning/performers'
        },
        {
          key: 'earning-listing-studio',
          label: 'Studio Earnings',
          route: '/earning/studios'
        }
      ]
    },
    {
      key: 'referrals',
      label: 'Referrals',
      icon: <UsergroupAddOutlined />,
      children: [
        {
          key: 'referrals-listing',
          label: 'All referrals',
          route: '/referral'
        },
        {
          key: 'referral-earning',
          label: 'Referral earnings',
          route: '/referral/referral-earning'
        }
      ]
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: <DollarOutlined />,
      children: [
        {
          key: 'paymentslist',
          label: 'Payments',
          icon: <DollarOutlined />,
          route: '/payment'
        },
        {
          key: 'payment-information',
          label: 'Payment Informations',
          icon: <BankFilled />,
          route: '/payment-information'
        }
      ]
    },
    {
      key: 'order',
      label: 'Order history',
      icon: <OrderedListOutlined />,
      children: [
        {
          key: 'order-listing',
          label: 'Orders Managment',
          route: '/order'
        }
      ]
    },
    {
      key: 'payout',
      label: 'Payout requests',
      icon: <MenuUnfoldOutlined />,
      children: [
        {
          key: 'payout-listing-performer',
          label: 'Performer Requests',
          route: '/payout-request'
        },
        {
          key: 'payout-listing-studio',
          label: 'Studio Requests',
          route: '/payout-request/studios'
        }
      ]
    },
    // {
    //   key: 'refund',
    //   label: 'Refund requests',
    //   icon: <ExclamationOutlined />,
    //   children: [
    //     {
    //       key: 'refund-listing',
    //       label: 'Refund Request Managment',
    //       route: '/refund-request'
    //     }
    //   ]
    // },
    {
      key: 'cam-aggregator',
      label: 'Cams aggregator',
      icon: <BankOutlined />,
      children: [
        {
          key: 'cam-category',
          label: 'Category manager',
          route: '/cam-aggregator'
        },
        {
          key: 'aggregator-settings',
          label: 'Settings',
          route: '/settings',
          as: '/settings'
        }, {
          key: 'push-notification',
          label: 'Push Notification',
          icon: <SoundOutlined />,
          route: '/push-notification'
        }
      ]
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <PieChartOutlined />,
      children: [
        {
          key: 'system-settings',
          route: '/settings',
          as: '/settings',
          label: 'System settings'
        },
        {
          label: 'Account settings',
          key: 'account-settings',
          route: '/account/settings'
        }
      ]
    },
    {
      key: 'logger',
      label: 'Logger',
      icon: <HeatMapOutlined />,
      children: [
        {
          key: 'system-logs',
          route: '/logger/system-logs',
          as: '/logger/system-logs',
          label: 'System logs'
        },
        {
          key: 'http-exception-logs',
          route: '/logger/http-exception-logs',
          as: '/logger/http-exception-logs',
          label: 'HttpException logs'
        },
        {
          key: 'Request-logs',
          route: '/logger/request-logs',
          as: '/logger/request-logs',
          label: 'Request logs'
        }
      ]
    }
  ];
  const siderProps = {
    collapsed,
    isMobile,
    logo,
    siteName,
    theme,
    menus: sliderMenus,
    onCollapseChange,
    onThemeChange
  };
  return (
    <Layout>
      <Sider {...siderProps} />
      <div className={style.container} style={{ paddingTop: fixedHeader ? 72 : 0 }} id="primaryLayout">
        <Header {...headerProps} />
        <Layout.Content className={style.content} style={{ position: 'relative' }}>
          {routerChange && <Loader spinning />}
          {/* <Bread routeList={newRouteList} /> */}
          {children}
        </Layout.Content>
        <BackTop className={style.backTop} target={() => document.querySelector('#primaryLayout') as any} />
      </div>
    </Layout>
  );
}

const mapStateToProps = (state: any) => ({
  ui: state.ui
});
const mapDispatchToProps = {
  updateUIHandler: updateUIValue,
  loadUIHandler: loadUIValue
};

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryLayout);
