import {
  AreaChartOutlined,
  DotChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { BreadcrumbComponent } from '@components/common';
import { statsService } from '@services/stats.service';
import {
  Card, Col, Row, Statistic
} from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface D {
  route: string;
  asPath: string;
  title: string;
  valueStyle: React.StyleHTMLAttributes<any>;
  prefix: any;
  query: Record<string, any>;
}

const initialData: Record<string, D> = {
  totalActiveUsers: {
    route: '/users',
    asPath: '/users?status=active',
    title: 'ACTIVE USERS',
    valueStyle: { color: '#ffc107' },
    prefix: <LineChartOutlined />,
    query: { status: 'active' }
  },
  totalInactiveUsers: {
    route: '/users',
    asPath: '/users?status=inactive',
    title: 'INACTIVE USERS',
    valueStyle: { color: '#ffc107' },
    prefix: <LineChartOutlined />,
    query: { status: 'inactive' }
  },
  totalPendingUsers: {
    route: '/users',
    asPath: '/users?status=pending',
    title: 'PENDING USERS',
    valueStyle: { color: '#ffc107' },
    prefix: <LineChartOutlined />,
    query: { status: 'pending' }
  },
  totalActivePerformers: {
    route: '/performer',
    asPath: '/performer?status=active',
    title: 'ACTIVE PERFORMERS',
    valueStyle: { color: '#009688' },
    prefix: <LineChartOutlined />,
    query: { status: 'active' }
  },
  totalInactivePerformers: {
    route: '/performer',
    asPath: '/performer?status=inactive',
    title: 'INACTIVE PERFORMERS',
    valueStyle: { color: '#009688' },
    prefix: <LineChartOutlined />,
    query: { status: 'inactive' }
  },
  totalPendingPerformers: {
    route: '/performer',
    asPath: '/performer?status=pending',
    title: 'PENDING PERFORMERS',
    valueStyle: { color: '#009688' },
    prefix: <LineChartOutlined />,
    query: { status: 'pending' }
  },
  totalActiveStudio: {
    route: '/studios',
    asPath: '/studios?status=active',
    title: 'ACTIVE STUDIO',
    valueStyle: { color: '#ff66b3' },
    prefix: <LineChartOutlined />,
    query: { status: 'active' }
  },
  totalInactiveStudio: {
    route: '/studios',
    asPath: '/studios?status=inactive',
    title: 'INACTIVE STUDIO',
    valueStyle: { color: '#ff66b3' },
    prefix: <LineChartOutlined />,
    query: { status: 'inactive' }
  },
  totalPendingStudio: {
    route: '/studios',
    asPath: '/studios?status=pending',
    title: 'PENDING STUDIO',
    valueStyle: { color: '#ff66b3' },
    prefix: <LineChartOutlined />,
    query: { status: 'pending' }
  },
  totalGalleries: {
    route: '/gallery',
    asPath: '/gallery',
    title: 'GALLERIES',
    valueStyle: { color: '#5399d0' },
    prefix: <PieChartOutlined />,
    query: {}
  },
  totalPhotos: {
    route: '/photos',
    asPath: '/photos',
    title: 'PHOTOS',
    valueStyle: { color: '#5399d0' },
    prefix: <PieChartOutlined />,
    query: {}
  },
  totalVideos: {
    route: '/video',
    asPath: '/video',
    title: 'VIDEOS',
    valueStyle: { color: '#5399d0' },
    prefix: <DotChartOutlined />,
    query: {}
  },
  totalProducts: {
    route: '/product',
    asPath: '/product',
    title: 'PRODUCTS',
    valueStyle: { color: '#5399d0' },
    prefix: <PieChartOutlined />,
    query: {}
  },
  totalDeliverdOrders: {
    route: '/order',
    asPath: '/order?deliveryStatus=delivered',
    title: 'DELIVERED ORDERS',
    valueStyle: { color: '#c8d841' },
    prefix: <AreaChartOutlined />,
    query: { deliveryStatus: 'delivered' }
  },
  totalShippingdOrders: {
    route: '/order',
    asPath: '/order?deliveryStatus=shipping',
    title: 'SHIPPING ORDERS',
    valueStyle: { color: '#c8d841' },
    prefix: <AreaChartOutlined />,
    query: { deliveryStatus: 'shipping' }
  },
  totalRefundedOrders: {
    route: '/order',
    asPath: '/order?deliveryStatus=refunded',
    title: 'REFUNDED ORDERS',
    valueStyle: { color: '#c8d841' },
    prefix: <AreaChartOutlined />,
    query: { deliveryStatus: 'refunded' }
  },
  totalGrossPrice: {
    route: '/earning',
    asPath: '/earning',
    title: 'GROSS PROFIT',
    valueStyle: { color: '#fb2b2b' },
    prefix: <DotChartOutlined />,
    query: {}
  },
  totalNetPrice: {
    route: '/earning',
    asPath: '/earning',
    title: 'NET PROFIT',
    valueStyle: { color: '#fb2b2b' },
    prefix: <DotChartOutlined />,
    query: {}
  },
  totalStreamTime: {
    route: '/performer',
    asPath: '/performer',
    title: 'STREAM TIMES',
    valueStyle: { color: '#fb2b2b' },
    prefix: <DotChartOutlined />,
    query: {}
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});

  const dashboadStats = async () => {
    const resp = await statsService.dashboadStats();
    setStats(resp.data);
  };

  useEffect(() => {
    dashboadStats();
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Statistic' }]} />
      <Row gutter={24} className="dashboard-stats">
        {stats
          && Object.keys(initialData).map((key) => (
            <Col span={8}>
              <Link
                href={{
                  pathname: initialData[key].route,
                  query: initialData[key].query
                }}
                as={initialData[key].asPath}
              >
                <a>
                  <Card>
                    <Statistic
                      title={initialData[key].title}
                      value={stats[key] || 0}
                      valueStyle={initialData[key].valueStyle}
                      prefix={initialData[key].prefix}
                    />
                  </Card>
                </a>
              </Link>
            </Col>
          ))}
      </Row>
    </>
  );
}
