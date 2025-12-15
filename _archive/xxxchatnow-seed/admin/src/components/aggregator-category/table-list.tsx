import {
  EditOutlined
} from '@ant-design/icons';
import { DropdownAction } from '@components/common/dropdown-action';
import { Table, Tag } from 'antd';
import Link from 'next/link';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
}

export function TableListAggregator({
  dataSource = [],
  rowKey = '_id',
  loading = false,
  pagination = {},
  onChange = () => {}
}: IProps) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true
    },
    {
      title: 'Alias',
      dataIndex: 'alias',
      sorter: true
    },
    {
      title: 'Status',
      dataIndex: 'active',
      sorter: true,
      render(active: boolean) {
        switch (active) {
          case true:
            return <Tag color="green">Active</Tag>;
          case false:
            return <Tag color="red">Inactive</Tag>;
          default: return <Tag color="default">{active}</Tag>;
        }
      }
    },
    // {
    //     title: 'Tags',
    //     dataIndex: 'tags'
    // },
    {
      title: 'Actions',
      dataIndex: '_id',
      fixed: 'right' as 'right',
      render: (data, record) => (
        <DropdownAction
          menuOptions={[
            {
              key: 'update',
              name: 'Update',
              children: (
                <Link
                  href={{
                    pathname: '/cam-aggregator/update',
                    query: { id: record._id }
                  }}
                  as={`/cam-aggregator/update?id=${record._id}`}
                >
                  <a>
                    <EditOutlined />
                    {' '}
                    Update
                  </a>
                </Link>
              )
            }
            // {
            //   key: 'delete',
            //   name: 'Delete',
            //   children: (
            //     <span>
            //       <DeleteOutlined /> Delete
            //     </span>
            //   ),
            //   onClick: () =>
            //     this.props.deleteGallery &&
            //     this.props.deleteGallery(record._id)
            // }
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
      pagination={{ ...pagination }}
      onChange={onChange.bind(this)}
      scroll={{ x: 700, y: 650 }}
    />
  );
}

export default TableListAggregator;
