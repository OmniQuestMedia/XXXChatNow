import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DropdownAction } from '@components/common';
import { formatDate } from '@lib/date';
import { Table, Tag } from 'antd';
import Link from 'next/link';
import React from 'react';

interface IProps {
  dataSource: any[];
  pagination: {};
  loading: boolean;
  onChange: Function;
  deleteLeaderBoard: Function;
}

function LeaderBoardTableList({
  dataSource,
  pagination,
  loading,
  onChange,
  deleteLeaderBoard
}: IProps) {
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render(title: string) {
        return (
          <span>
            {title}
          </span>
        );
      }
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render(duration: string) {
        switch (duration) {
          case 'last_day': return <span>Last Day</span>;
          case 'last_week': return <span>Last Week</span>;
          case 'last_month': return <span>Last Month</span>;
          case 'last_year': return <span>Last Year</span>;
          default: return <span>{duration}</span>;
        }
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render(type: string) {
        switch (type) {
          case 'totalTip': return <span>Total Tip</span>;
          case 'totalSpent': return <span>Total Amount Spent</span>;
          case 'totalEarned': return <span>Total Earning</span>;
          default: return <span>{type}</span>;
        }
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render(status: string) {
        switch (status) {
          case 'active':
            return <Tag color="green">Active</Tag>;
          case 'inactive':
            return <Tag color="black">Inactive</Tag>;
          default:
            return <Tag color="black">Refunded</Tag>;
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
                    pathname: '/leader-board/update',
                    query: { id }
                  }}
                  as={`/leader-board/update?id=${id}`}
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
              onClick: () => deleteLeaderBoard && deleteLeaderBoard(id)
            }
          ]}
        />
      )
    }
  ];

  return (
    <Table
      scroll={{ x: true }}
      rowKey="leader-board"
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      loading={loading}
      onChange={onChange.bind(this)}
    />
  );
}

export default LeaderBoardTableList;
