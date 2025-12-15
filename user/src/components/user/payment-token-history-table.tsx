import { Table } from 'antd';
import React from 'react';
import { IPaymentTokenHistory } from 'src/interfaces';
import { formatDate } from 'src/lib';

interface IProps {
  paymentTokenHistory: IPaymentTokenHistory[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange(pagination, filters, sorter, extra): Function;
}

function ProductsTable({
  paymentTokenHistory,
  searching,
  total,
  pageSize,
  onChange
}: IProps) {
  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: 'id',
      responsive: ['xxl', 'xl', 'lg', 'md']
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render(name, record) {
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
            {name || record.type}
          </span>
        );
      }
    },
    {
      title: 'Seller / To',
      dataIndex: 'sellerId',
      key: 'sellerId',
      render: (sellerId: string, record) => record.sellerInfo?.username || 'N/A',
      responsive: ['xxl', 'xl', 'lg', 'md']
    },
    {
      title: 'Tokens',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      sorter: true
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['xxl', 'xl', 'lg', 'md'],
      render: (date: Date) => (
        <span>{formatDate(date, 'MMMM DD, YYYY HH:mm')}</span>
      ),
      sorter: true
    }
  ] as any;
  const dataSource = paymentTokenHistory.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange}
    />
  );
}

export default ProductsTable;
