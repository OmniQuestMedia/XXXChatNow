import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
}

export function TableListPaymentTransaction({
  dataSource = [],
  rowKey = '_id',
  loading = false,
  pagination = {},
  onChange
}: IProps) {
  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: '_id',
      key: 'user',
      render(_id) {
        return (
          <div>
            {_id.slice(16, 24).toUpperCase()}
          </div>
        );
      }
    },
    {
      title: 'Buyer',
      dataIndex: 'buyerInfo',
      key: 'buyerId',
      render(buyerInfo) {
        return (
          <div>
            {buyerInfo?.username}
            <br />
            {buyerInfo?.email}
          </div>
        );
      }
    },
    {
      title: 'Description',
      render(_data, record) {
        return record.products.map((re) => (
          <p key={re._id}>
            <span>{re.name}</span>
            {' '}
            <br />
            <small>{re.description}</small>
          </p>
        ));
      }
    },
    {
      title: 'Payment gateway',
      dataIndex: 'paymentGateway',
      sorter: true,
      render(data, record) {
        return <Tag color="orange">{record.paymentGateway}</Tag>;
      }
    },
    {
      title: 'Original price',
      dataIndex: 'originalPrice',
      sorter: true,
      render(data, record) {
        return (
          <span>
            $
            {(record.originalPrice && record.originalPrice.toFixed(2))
              || record.totalPrice.toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'End Price',
      dataIndex: 'totalPrice',
      sorter: true,
      render(data, record) {
        return (
          <span>
            $
            {record.totalPrice && record.totalPrice.toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Discount',
      dataIndex: 'couponInfo',
      sorter: true,
      render(data, record) {
        return record.couponInfo ? (
          <span>
            {`${record.couponInfo.value * 100}%`}
            {' '}
            - $
            {(record.originalPrice * record.couponInfo.value).toFixed(2)}
          </span>
        ) : (
          ''
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      sorter: true,
      render(type: number) {
        return <Tag color="orange">{type}</Tag>;
      }
    },
    {
      title: 'Payment status',
      dataIndex: 'status',
      sorter: true,
      render(status: string) {
        switch (status) {
          case 'pending':
            return <Tag color="orange">Pending</Tag>;
          case 'success':
            return <Tag color="green">Success</Tag>;
          case 'cancel':
            return <Tag color="red">Cancel</Tag>;
          default:
            return <Tag color="red">Pending</Tag>;
        }
      }
    },
    {
      title: 'Last update',
      dataIndex: 'updatedAt',
      sorter: true,
      fixed: 'right' as 'right',
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    }
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      rowKey={rowKey}
      loading={loading}
      pagination={pagination}
      onChange={onChange.bind(this)}
      scroll={{ x: 700, y: 650 }}
    />
  );
}

export default TableListPaymentTransaction;
