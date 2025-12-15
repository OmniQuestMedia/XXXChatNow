import NumberFormat from '@components/common/layout/numberformat';
import { Table, Tag } from 'antd';
import React from 'react';
import { IUser } from 'src/interfaces';
import { IEarning } from 'src/interfaces/earning';
import { capitalizeFirstLetter, formatDate } from 'src/lib';

import style from './earning-independent-table.module.less';

interface IProps {
  earnings: IEarning[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange(pagination, filters, sorter, extra): Function;
  // eslint-disable-next-line camelcase
  role_data: 'model' | 'studio';
}

const customCell = ({ children, bordered }) => <td style={{ border: bordered ? '1px solid var(--border-color)' : 'none' }}>{children}</td>;

function EarningIndependentTable({
  earnings,
  searching,
  total,
  pageSize,
  onChange,
  // eslint-disable-next-line camelcase
  role_data
}: IProps) {
  const columns = [
    {
      title: 'Reference',
      dataIndex: 'transactionTokenId',
      key: 'transactionTokenId',
      fixed: 'left',
      render: (transactionTokenId) => transactionTokenId?.slice(16, 24).toUpperCase() || 'N/A',
      onCell: () => ({ bordered: true })
    },
    {
      title: 'Date',
      key: 'createdAt',
      dataIndex: 'createdAt',
      render: (createdAt: Date) => <span>{formatDate(createdAt)}</span>,
      sorter: true,
      onCell: () => ({ bordered: true })
    },
    {
      title: 'From',
      dataIndex: 'sourceInfo',
      key: 'from',
      render: (sourceInfo: IUser) => (sourceInfo?.displayName || sourceInfo?.username || 'N/A'),
      onCell: () => ({ bordered: true })
    },
    {
      title: 'To',
      dataIndex: 'targetInfo',
      key: 'to',
      render: (targetInfo: IUser) => targetInfo?.username || 'N/A',
      onCell: () => ({ bordered: true })
    },
    {
      title: 'Transaction Type',
      dataIndex: 'type',
      key: 'type',
      render(type: string) {
        switch (type) {
          case 'sale_video':
            return <Tag color="magenta">Sale Video</Tag>;
          case 'sale_product':
            return <Tag color="volcano">Sale Product</Tag>;
          case 'sale_photo':
            return <Tag color="orange">Sale Photo</Tag>;
          case 'tip':
            return <Tag color="gold">Tip</Tag>;
          case 'stream_private':
            return <Tag color="blue">Private</Tag>;
          case 'stream_group':
            return <Tag color="green">Group</Tag>;
          case 'spin_wheel':
            return <Tag color="red">Wheel</Tag>;
          default:
            return <Tag>{type}</Tag>;
        }
      },
      onCell: () => ({ bordered: true })
    },
    {
      title: 'Tokens Received',
      dataIndex: 'grossPrice',
      key: 'grossPrice',
      render: (grossPrice: number) => <NumberFormat value={grossPrice} />,
      onCell: () => ({ bordered: true })
    },
    // {
    //   title: 'Net Price',
    //   dataIndex: 'netPrice',
    //   key: 'netPrice',
    //   render: (netPrice: number) => <NumberFormat value={netPrice} />,
    //   sorter: true
    // },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      onCell: () => ({ bordered: true })
    },
    // {
    //   title: `${capitalizeFirstLetter(role_data)} Earning Money`,
    //   dataIndex: 'price',
    //   key: 'price',
    //   render: (price: number) => <NumberFormat value={price} />
    // },
    // {
    //   title: `${capitalizeFirstLetter(role_data)} Commission`,
    //   dataIndex: 'commission',
    //   key: 'commission',
    //   render: (commission: number) => <NumberFormat value={commission} suffix="%" />
    // },
    {
      title: 'Admin Earnings',
      children: [
        {
          title: '%',
          id: 'adminIndependentCommission',
          dataIndex: 'commission',
          render(commission: number) {
            return <span>{100 - commission}</span>;
          },
          onCell: () => ({ bordered: true })
        },
        {
          title: 'Tokens',
          id: 'adminIndependentToken',
          render: (_, record) => ((record.grossPrice - record.netPrice)).toFixed(2),
          onCell: () => ({ bordered: true })
        },
        {
          title: 'Converted Amount',
          id: 'adminIndependentAmount',
          render: (_, record) => ((record.grossPrice - record.netPrice) * record.conversionRate).toFixed(2),
          onCell: () => ({ bordered: true })
        }
      ]
    },
    {
      title: `${capitalizeFirstLetter(role_data)} Earnings`,
      children: [
        {
          title: '%',
          id: 'independentCommission',
          dataIndex: 'commission',
          render(commission: number) {
            return <span>{commission}</span>;
          },
          onCell: () => ({ bordered: true })
        },
        {
          title: 'Tokens',
          id: 'independentToken',
          dataIndex: 'netPrice',
          render: (netPrice: number) => netPrice.toFixed(2),
          onCell: () => ({ bordered: true })
        },
        {
          title: 'Converted Amount',
          id: 'independentAmount',
          render: (_, record) => (record.netPrice * record.conversionRate).toFixed(2),
          onCell: () => ({ bordered: true })
        }
      ]
    },
    {
      title: 'Payout Status',
      key: 'payoutStatus',
      dataIndex: 'payoutStatus',
      render: (payoutStatus: string) => {
        switch (payoutStatus) {
          case 'approved':
            return <Tag color="blue">Approved</Tag>;
          case 'pending':
            return <Tag color="warning">Pending</Tag>;
          case 'rejected':
            return <Tag color="volcano">Rejected</Tag>;
          case 'done':
            return <Tag color="green">Paid</Tag>;
          default: return <Tag>{payoutStatus}</Tag>;
        }
      }
    }
  ] as any;
  const dataSource = earnings.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className={style['model-earnings-table']}
      pagination={{
        total,
        pageSize,
        showSizeChanger: false,
        position: ['bottomCenter']
      }}
      scroll={{ x: 2000 }}
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange}
      bordered
      components={{
        body: {
          cell: customCell
        }
      }}
      locale={{
        emptyText: 'No data'
      }}
    />
  );
}

export default EarningIndependentTable;
