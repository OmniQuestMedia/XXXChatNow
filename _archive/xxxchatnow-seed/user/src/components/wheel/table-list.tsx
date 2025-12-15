import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { formatDate } from '@lib/date';
import { Button, Table, Tag } from 'antd';
import Link from 'next/link';

type IProps = {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  deleteOption?: Function;
}

export function TableListWheelOptions({
  dataSource,
  rowKey,
  loading,
  deleteOption = () => {}
}: IProps) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render(status: string) {
        switch (status) {
          case 'active':
            return <Tag color="green">Active</Tag>;
          case 'inactive':
            return <Tag color="default">Inactive</Tag>;
          default:
            break;
        }
        return <Tag color="default">{status}</Tag>;
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
      title: 'Color',
      dataIndex: 'color',
      render(color: string) {
        return <Tag color={color} style={{ width: '50px', height: '30px' }} />;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (data, record) => (
        <div>
          <Button className="info">
            <Link
              href={{
                pathname: '/account/performer/wheel/update',
                query: { id: record._id }
              }}
            >
              <a>
                <EditOutlined />
                {' '}
                Edit
              </a>
            </Link>
          </Button>
          <Button
            onClick={() => deleteOption && deleteOption(record._id)}
            className="danger"
          >
            <DeleteOutlined />
          </Button>
        </div>
      )
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        loading={loading}
      />
    </div>
  );
}

export default TableListWheelOptions;
