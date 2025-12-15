import { EyeOutlined } from '@ant-design/icons';
import NumberFormat from '@components/common/layout/numberformat';
import { PerformerUsername } from '@components/performer';
import { formatDate } from '@lib/date';
import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import Link from 'next/link';
import React from 'react';
import { IOrder } from 'src/interfaces';

import { OrderStatus } from './order-status';

interface IProps {
  dataSource: IOrder[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange(pagination, filters, sorter, extra): Function;
  type: string;
}

function OrderTableList({
  dataSource,
  pagination,
  rowKey,
  loading,
  onChange,
  type
}: IProps) {
  const columns: ColumnsType<IOrder> = [
    {
      title: 'Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber'
    },
    {
      title: `${type === 'user' ? 'Seller' : 'Buyer'}`,
      dataIndex: `${type === 'user' ? 'performerId' : 'userId'}`,
      key: `${type === 'user' ? 'performerId' : 'userId'}`,
      sorter: true,
      responsive: ['xxl', 'xl', 'lg', 'md'],
      render(data, record) {
        if (type === 'user') {
          if (record.sellerSource === 'system') return <span>System</span>;
          return record?.sellerInfo ? (
            <PerformerUsername performer={record.sellerInfo} />
          ) : (
            <span>N/A</span>
          );
        }

        return (record?.buyerInfo?.displayName || record?.buyerInfo?.username || 'N/A');
      }
    },
    {
      title: 'Product name',
      dataIndex: 'name',
      sorter: true,
      key: 'name',
      render(name: string) {
        return (
          <span
            style={{
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '1',
              WebkitBoxOrient: 'vertical'
            }}
          >
            {name}
          </span>
        );
      }
    },
    {
      title: 'Product info',
      dataIndex: 'description',
      key: 'description',
      responsive: ['xxl', 'xl', 'lg', 'md'],
      render(description) {
        return (
          <span
            style={{
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '1',
              WebkitBoxOrient: 'vertical'
            }}
          >
            {description}
          </span>
        );
      }
    },
    // {
    //   title: 'Type',
    //   dataIndex: 'type',
    //   sorter: true,
    //   key: 'type',
    //   responsive: ['xxl', 'xl', 'lg', 'md']
    // },
    {
      title: 'Type',
      dataIndex: 'productType',
      sorter: true,
      key: 'productType',
      responsive: ['xxl', 'xl', 'lg', 'md']
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      sorter: true,
      key: 'quantity',
      render(quantity) {
        return <span>{quantity}</span>;
      }
    },
    {
      title: 'Total Price (tokens)',
      dataIndex: 'totalPrice',
      sorter: true,
      key: 'totalPrice',
      render(data, record) {
        if (record.payBy === 'token') {
          return (
            <span>
              <NumberFormat value={record.totalPrice} />
              {' '}
              token(s)
            </span>
          );
        }
        return (
          <span>
            $
            <NumberFormat value={record.totalPrice} />
          </span>
        );
      }
    },
    {
      title: 'Delivery Status',
      // dataIndex: 'deliveryStatus',
      key: 'deliveryStatus',
      sorter: true,
      render(record: any) {
        if (record.productType !== 'physical') return null;
        return <OrderStatus status={record.deliveryStatus} />;
      }
    },
    {
      title: 'Last updated at',
      dataIndex: 'createdAt',
      sorter: true,
      key: 'createdAt',
      responsive: ['xxl', 'xl', 'lg', 'md'],
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render(id: string) {
        return (
          <Link
            href={{ pathname: `/account/${type}/orders/detail`, query: { id } }}
          >
            <a>
              <EyeOutlined />
            </a>
          </Link>
        );
      }
    }
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      rowKey={rowKey}
      loading={loading}
      onChange={onChange.bind(this)}
      scroll={{ x: 1300 }}
    />
  );
}
export default OrderTableList;
