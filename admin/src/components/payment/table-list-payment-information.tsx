import { EyeOutlined } from '@ant-design/icons';
import { DropdownAction } from '@components/common/dropdown-action';
import { formatDate } from '@lib/date';
import { Table } from 'antd';
import { PureComponent } from 'react';

interface IProps {
  dataSource: [];
  rowKey: string;
  loading: boolean;
  pagination: {};
  onChange: Function;
  onViewDeital: Function;
}

export class TableListPaymentInformation extends PureComponent<IProps> {
  render() {
    const {
      dataSource,
      rowKey,
      loading,
      pagination,
      onChange,
      onViewDeital
    } = this.props;
    const columns = [
      {
        title: 'Username',
        dataIndex: 'sourceInfo',
        key: 'username',
        render: (sourceInfo) => sourceInfo?.username
      },
      {
        title: 'Role',
        dataIndex: 'sourceType',
        key: 'sourceType'
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type'
      },
      {
        title: 'Last update',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date, 'DD/MM/YYYY HH:mm')}</span>;
        }
      },
      {
        title: 'Actions',
        fixed: 'right' as 'right',
        render(record) {
          return (
            <DropdownAction
              menuOptions={[
                {
                  key: 'view',
                  name: 'View',
                  children: (
                    <span>
                      <EyeOutlined />
                      {' '}
                      View
                    </span>
                  ),
                  onClick: () => onViewDeital(record._id)
                }
              ]}
            />
          );
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
}
