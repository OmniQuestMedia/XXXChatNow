import { IReferral } from '@interface/referral';
import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';

interface IProps {
  dataSource: IReferral[];
  loading: boolean;
  rowKey: string;
  onChange: Function;
  pagination: { total, pageSize}
}

function TableListReferralUser({
  dataSource, loading, rowKey, onChange, pagination
}: IProps) {
  const columns = [
    {
      title: 'Name',
      render(data, record) {
        return (
          <span>{record.registerInfo?.username}</span>
        );
      }
    },
    {
      title: 'Role',
      render(data, record) {
        switch (record?.registerSource) {
          case 'performer':
            return <Tag color="orange">Model</Tag>;
          case 'user':
            return <Tag color="cyan">User</Tag>;
          default: return <Tag color="default">{record?.registerSource}</Tag>;
        }
      }
    },
    {
      title: 'Updated On',
      dataIndex: 'createdAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    }
  ];
  return (
    <div className="table-responsive">
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        onChange={onChange.bind(this)}
        pagination={pagination.total <= pagination.pageSize ? false : pagination}
      />
    </div>
  );
}

export default TableListReferralUser;
