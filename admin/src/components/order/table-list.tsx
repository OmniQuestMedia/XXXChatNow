import { EyeOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { capitalizeFirstLetter } from '@lib/string';
import { Table, Tag } from 'antd';
import Link from 'next/link';
import { IOrder } from 'src/interfaces/order';

interface IProps {
  dataSource: IOrder[];
  pagination: {};
  rowKey: string;
  loading: boolean;
  onChange: Function;
}

function OrderTableList({
  dataSource,
  pagination,
  rowKey,
  loading,
  onChange
}: IProps) {
  const columns = [
    {
      title: 'Buyer',
      dataIndex: 'buyerId',
      key: 'buyerInfo',
      sorter: true,
      render(data, record) {
        return (
          <span>
            @
            {record?.buyerInfo?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Seller',
      dataIndex: 'sellerInfo',
      key: 'sellerInfo',
      sorter: true,
      render(sellerInfo, record) {
        if (record.sellerSource === 'system') return 'System';
        return (
          <span>
            @
            {sellerInfo?.username || 'N/A'}
          </span>
        );
      }
    },
    {
      title: 'Product name',
      dataIndex: 'name',
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
      dataIndex: 'name',
      sorter: false,
      render(q, record) {
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
            {record.description}
          </span>
        );
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      sorter: true,
      render(quantity) {
        return <span>{quantity}</span>;
      }
    },
    {
      title: 'Total Price (token)',
      dataIndex: 'totalPrice',
      sorter: true,
      render(totalPrice) {
        return totalPrice && <span>{Number(totalPrice).toFixed(2)}</span>;
      }
    },
    {
      title: 'Delivery Status',
      // dataIndex: 'deliveryStatus',
      render(record: any) {
        if (record.productType !== 'physical') return null;
        switch (record.deliveryStatus) {
          case 'processing':
            return <Tag color="default">Processing</Tag>;
          case 'shipping':
            return <Tag color="warning">Shipping</Tag>;
          case 'delivered':
            return <Tag color="success">Delivered</Tag>;
          case 'refunded':
            return <Tag color="volcano">Refunded</Tag>;
          default:
            return <Tag>{capitalizeFirstLetter(record.deliveryStatus)}</Tag>;
        }
      }
    },
    {
      title: 'Last updated at',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      // fixed: 'right' as 'right',
      sorter: true,
      render(id: string) {
        return (
          <Link href={{ pathname: '/order/detail', query: { id } }}>
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
      scroll={{ x: true }}
    />
  );
}
export default OrderTableList;
