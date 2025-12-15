import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DropdownAction } from '@components/common/dropdown-action';
import { ThumbnailVideo } from '@components/video/thumbnail-video';
import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';
import Link from 'next/link';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  onDelete: Function;
}

export function TableListVideo({
  dataSource = [],
  rowKey = '_id',
  loading = false,
  pagination = {},
  onChange = () => {},
  onDelete = () => {}
}: IProps) {
  const columns = [
    {
      title: '',
      dataIndex: 'thumbnail',
      render(data, record) {
        return <ThumbnailVideo video={record} />;
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      sorter: true
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
                    pathname: '/video/update',
                    query: { id }
                  }}
                  as={`/video/update?id=${id}`}
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
              onClick: () => onDelete(id)
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
      scroll={{ x: 700, y: 650 }}
    />
  );
}
