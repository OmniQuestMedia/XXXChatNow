import { EyeOutlined } from '@ant-design/icons';
import { Table, Tag } from 'antd';
import Link from 'next/link';
import { IPayoutRequest } from 'src/interfaces';
import { formatDate } from 'src/lib/date';

interface IProps {
  rowKey?: string;
  data?: IPayoutRequest[];
  loading?: boolean;
  pagination?: {};
  onChange?: Function;
}

function PayoutRequestTable({
  rowKey = '_id',
  data = [],
  loading,
  pagination,
  onChange
}: IProps) {
  const columns = [
    {
      title: 'Requester',
      key: 'username',
      // sorter: true,
      render(_, record: IPayoutRequest) {
        const source = record.sourceInfo || record.performerInfo || record.studioInfo;
        return (
          <span>
            {source?.username
              || source?.name
              || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Role',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (sourceType: string) => <span>{sourceType}</span>
    },
    {
      title: 'Pay Period',
      dataIndex: 'fromDate',
      key: 'fromDate',
      render(_data, record: IPayoutRequest) {
        return (
          <span>
            {formatDate(record.fromDate, 'DD/MM/YYYY')}
            {' '}
            -
            {' '}
            {formatDate(record.toDate, 'DD/MM/YYYY')}
          </span>
        );
      }
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentAccountType',
      key: 'paymentAccountType',
      render: (paymentAccountType: string) => <span>{paymentAccountType || ''}</span>
    },
    {
      title: 'Total Token Request',
      dataIndex: 'tokenMustPay',
      align: 'center' as 'center',
      key: 'tokenMustPay',
      sorter: true,
      render(item) {
        return (item || 0).toFixed(2);
      }
    },
    {
      title: 'Previously Paid Tokens',
      dataIndex: 'previousPaidOut',
      align: 'center' as 'center',
      key: 'previousPaidOut',
      sorter: true,
      render(item) {
        return (item || 0).toFixed(2);
      }
    },
    {
      title: 'Remaining Token',
      dataIndex: 'pendingToken',
      align: 'center' as 'center',
      key: 'pendingToken',
      sorter: true,
      render(item) {
        return (item || 0).toFixed(2);
      }
    },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      align: 'center' as 'center',
      key: 'conversionRate',
      render: (conversionRate: number) => <span>{conversionRate || 0}</span>
    },
    {
      title: 'Converted Amount',
      dataIndex: 'pendingToken',
      align: 'center' as 'center',
      key: 'convertedAmount',
      sorter: true,
      render(_, record: any) {
        return (record?.conversionRate ? record.pendingToken * record.conversionRate : 0).toFixed(2);
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as 'center',
      render(status: string) {
        switch (status) {
          case 'approved':
            return <Tag color="blue">Approved</Tag>;
          case 'pending':
            return <Tag color="warning">Pending</Tag>;
          case 'rejected':
            return <Tag color="volcano">Rejected</Tag>;
          case 'done':
            return <Tag color="green">Paid</Tag>;
          default: return <Tag>{status}</Tag>;
        }
      }
    },
    {
      title: 'Request Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      fixed: 'right' as 'right',
      sorter: true,
      render(id: string) {
        return (
          <Link href={{ pathname: '/payout-request/detail', query: { id } }}>
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
      columns={columns}
      rowKey={rowKey}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={onChange.bind(this)}
      scroll={{ x: 700, y: 650 }}
    />
  );
}

export default PayoutRequestTable;
