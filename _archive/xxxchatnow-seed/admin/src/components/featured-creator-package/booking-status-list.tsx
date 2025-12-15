import { formatDate } from '@lib/date';
import { Button, Table, Tag } from 'antd';
import { IFeaturedCreatorPackage } from 'src/interfaces';

interface IProps {
  dataSource: IFeaturedCreatorPackage[];
  rowKey: string;
  onCancel: Function;
}

export function FeaturedCreatorStatusList({ ...props }: IProps) {
  const Columns = [
    {
      title: 'Name',
      key: 'name',
      render: (record: any) => record?.package?.name
    },
    {
      title: 'Peformer',
      render: (record: any) => record?.performer?.username,
      key: 'performerId'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(status: string) {
        switch (status) {
          case 'active': return <Tag color="green">{status}</Tag>
          case 'inactive': return <Tag color="black">{status}</Tag>
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
      render: (id: string) => <Button onClick={() => props.onCancel(id)}>Cancel</Button>
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
