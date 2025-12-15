import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DropdownAction } from '@components/common/dropdown-action';
import { ImageProduct } from '@components/product/image-product';
import { formatDate } from '@lib/date';
import {
  Table, Tag
} from 'antd';
import { Breakpoint } from 'antd/lib/_util/responsiveObserve';
import Link from 'next/link';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  deleteProduct?: Function;
}

const breakpoint: Breakpoint = 'md';

export function TableListProduct({
  dataSource,
  rowKey,
  loading,
  pagination,
  onChange,
  deleteProduct = () => {}
}: IProps) {
  const columns = [
    {
      title: '',
      dataIndex: 'image',
      render(_, record) {
        return <ImageProduct product={record} />;
      },
      responsive: [breakpoint]
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
      fixed: 'left' as 'left',
      render(name: string) {
        return (
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: '4',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxHeight: '104px'
            }}
          >
            {name}
          </span>
        );
      }
    },
    {
      title: 'Token',
      dataIndex: 'token',
      sorter: true,
      render(token: number) {
        return <span>{token}</span>;
      }
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      sorter: true,
      render(stock: number) {
        return <span>{stock || 0}</span>;
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      sorter: true,
      render(type: number) {
        return <span>{type}</span>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      sorter: true,
      render(status: string) {
        switch (status) {
          case 'active':
            return <Tag color="green">Active</Tag>;
          case 'inactive':
            return <Tag color="red">Inactive</Tag>;
          default: return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: 'Performer',
      dataIndex: 'performer',
      render(data, record) {
        return <span>{record.performer && record.performer.username}</span>;
      }
    },
    {
      title: 'Last update',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      fixed: 'right' as 'right',
      render: (id: string) => (
        <DropdownAction
          menuOptions={[
            {
              key: 'update',
              name: 'Update',
              children: (
                <Link
                  href={{
                    pathname: '/product/update',
                    query: { id }
                  }}
                  as={`/product/update?id=${id}`}
                >
                  <a>
                    <EditOutlined />
                    {' '}
                    Update
                  </a>
                </Link>
              )
            },
            {
              key: 'delete',
              name: 'Delete',
              children: (
                <span>
                  <DeleteOutlined />
                  {' '}
                  Delete
                </span>
              ),
              onClick: () => deleteProduct(id)
            }
          ]}
        />
      )
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
      size="small"
      scroll={{ x: 700, y: 650 }}
    />
  );
}

export default TableListProduct;
