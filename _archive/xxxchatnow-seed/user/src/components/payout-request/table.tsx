import { Table, Tag } from 'antd';
import Link from 'next/link';
import React from 'react';
import { PayoutRequestInterface } from 'src/interfaces';
import { Breakpoint, formatDate } from 'src/lib';

interface IProps {
  payouts: PayoutRequestInterface[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange(pagination, filters, sorter, extra): Function;
  role?: string;
}

const breakPoint: Breakpoint[] = ['md'];
const format = 'DD/MM/YYYY';
function PayoutRequestList({
  payouts,
  searching,
  total,
  pageSize,
  role = '',
  onChange
}: IProps) {
  const columns = [
    {
      title: 'Pay Period',
      key: 'payPeriod',
      responsive: breakPoint,
      render: ({ fromDate, toDate } : any) => (
        <span>
          {`${formatDate(fromDate, format)} - ${formatDate(
            toDate,
            format
          )}`}
        </span>
      )
    },
    {
      title: 'Role',
      key: 'sourceType',
      dataIndex: 'sourceType',
      editable: false
    },
    {
      title: 'Payment Method',
      key: 'paymentAccountType',
      dataIndex: 'paymentAccountType',
      editable: false
    },
    {
      title: 'Total Token Request',
      key: 'tokenMustPay',
      dataIndex: 'tokenMustPay',
      editable: false
    },
    {
      title: 'Conversion Rate',
      key: 'conversionRate',
      dataIndex: 'conversionRate',
      render: (conversionRate: number) => <span>{conversionRate || 0}</span>
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      editable: false,
      render: (_, record: any) => (record?.conversionRate ? record.tokenMustPay * record.conversionRate : 0).toFixed(2)
    },
    {
      title: 'Note',
      key: 'requestNote',
      dataIndex: 'requestNote',
      editable: false
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        switch (status) {
          case 'approved':
            return <Tag color="blue">Approved</Tag>;
          case 'pending':
            return <Tag color="warning">Pending</Tag>;
          case 'rejected':
            return <Tag color="volcano">Rejected</Tag>;
          case 'done':
            return <Tag color="green">Paid</Tag>;
          default:
            return <Tag color="green">{status}</Tag>;
        }
      }
    },
    {
      title: 'Request Date',
      key: 'createdAt',
      dataIndex: 'createdAt',
      render: (createdAt: Date) => <span>{formatDate(createdAt)}</span>,
      sorter: true
    },
    {
      title: 'Payment Details',
      key: 'details',
      render: (request: PayoutRequestInterface) => (
        <Link
          href={{
            pathname:
              role === 'studio'
                ? '/studio/payout-requests/[id]/update'
                : '/account/performer/payout-requests/[id]/update',
            query: {
              // eslint-disable-next-line react/destructuring-assignment
              id: request._id,
              data: JSON.stringify(request)
            }
          }}
          as={
            role === 'studio'
              // eslint-disable-next-line react/destructuring-assignment
              ? `/studio/payout-requests/${request._id}/update`
              // eslint-disable-next-line react/destructuring-assignment
              : `/account/performer/payout-requests/${request._id}/update`
          }
        >
          <a>Click here to know more</a>
        </Link>
      )
    }
  ];
  const dataSource = payouts.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      scroll={{ x: true }}
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange}
    />
  );
}

export default PayoutRequestList;
