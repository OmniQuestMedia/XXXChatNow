import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DropdownAction } from '@components/common/dropdown-action';
import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';
import Link from 'next/link';
import { IFeaturedCreatorPackage } from 'src/interfaces';

interface IProps {
  dataSource: IFeaturedCreatorPackage[];
  rowKey: string;
  delete: Function;
}

export function FeaturedCreatorList({ ...props }: IProps) {
  const Columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'center' as 'center'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(status: string) {
        switch (status) {
          case 'created': return <Tag color="green">{status}</Tag>
          case 'paid': return <Tag color="blue">{status}</Tag>
          case 'cancel': return<Tag color="red">{status}</Tag>
          default: return <Tag color="black">{status}</Tag>
        }
      }
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render(data, record: IFeaturedCreatorPackage) {
        return formatDate(record.updatedAt);
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      fixed: 'right' as 'right',
      key: 'action',
      render: (id: string) => (
        <DropdownAction
          menuOptions={[
            {
              key: 'update',
              name: 'Update',
              children: (
                <Link
                  href={{
                    pathname: '/featured-creator-package/update',
                    query: { id }
                  }}
                  as={`/featured-creator-package/update?id=${id}`}
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
              onClick: () => props.delete && props.delete(id)
            }
          ]}
        />
      )
    }
  ];
  return (
    <Table
      dataSource={props.dataSource}
      columns={Columns}
      pagination={false}
      rowKey={props.rowKey}
      scroll={{ x: 700, y: 650 }}
    />
  );
}
