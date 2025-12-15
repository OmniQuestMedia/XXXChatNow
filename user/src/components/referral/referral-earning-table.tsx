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

function TableListReferralEarning({
  dataSource, loading, rowKey, onChange, pagination
}: IProps) {
  const columns = [
    {
      title: 'Gross Price',
      render(data, record) {
        return (
          <span>
            <img alt="coin" src="/token.png" width="25px" />
            {record?.grossPrice}
          </span>
        );
      }
    },
    {
      title: 'Commission Rate',
      render(data, record) {
        return (
          <span>
            {(record?.referralCommission || 0) * 100}
            %
          </span>
        );
      }
    },
    {
      title: 'Commission',
      dataIndex: 'netPrice',
      render(netPrice: number) {
        return (
          <Tag color="green">
            +
            {(netPrice || 0).toFixed(2)}
            {' '}
            <img alt="coin" src="/token.png" width="16px" style={{ marginBottom: '3px' }} />
          </Tag>
        );
      }
    },
    {
      title: 'Name',
      render(data, record) {
        return (
          <span>{record?.registerInfo?.username}</span>
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

export default TableListReferralEarning;
