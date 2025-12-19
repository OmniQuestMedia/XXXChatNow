/* eslint-disable react/destructuring-assignment */
import { Button, Table } from 'antd';
import React from 'react';
import { IPerformer } from 'src/interfaces';
import { formatDate } from 'src/lib';

interface IProps {
  data: IPerformer[];
  searching: boolean;
  // pagination?: any;
  pageSize: number;
  total: number;
  update: Function;
  onChange(pagination, filters, sorter, extra): Function;
}

function StudioCommissionsTable({
  data,
  searching,
  total,
  pageSize,
  update,
  onChange
}: IProps) {
  const columns = [
    {
      title: 'Username',
      key: 'username',
      dataIndex: 'username'
    },
    {
      title: 'Tip Commission',
      key: 'tipCommission',
      dataIndex: 'commissionSetting',
      render(commissionSetting) {
        return (
          <span>
            {commissionSetting?.tipCommission}
            %
          </span>
        );
      }
    },
    {
      title: 'Private Call Commission',
      key: 'privateCallCommission',
      dataIndex: 'commissionSetting',
      render(commissionSetting) {
        return (
          <span>
            {commissionSetting?.privateCallCommission}
            %
          </span>
        );
      }
    },
    {
      title: 'Group Call Commission',
      key: 'groupCallCommission',
      dataIndex: 'commissionSetting',
      render(commissionSetting) {
        return (
          <span>
            {commissionSetting?.groupCallCommission}
            %
          </span>
        );
      }
    },
    {
      title: 'Product Commission',
      key: 'productCommission',
      dataIndex: 'commissionSetting',
      render(commissionSetting) {
        return (
          <span>
            {commissionSetting?.productCommission}
            %
          </span>
        );
      }
    },
    {
      title: 'Gallery Commission',
      key: 'albumCommission',
      dataIndex: 'commissionSetting',
      render(commissionSetting) {
        return (
          <span>
            {commissionSetting?.albumCommission}
            %
          </span>
        );
      }
    },
    {
      title: 'Video Commission',
      key: 'videoCommission',
      dataIndex: 'commissionSetting',
      render(commissionSetting) {
        return (
          <span>
            {commissionSetting?.videoCommission}
            %
          </span>
        );
      }
    },
    {
      title: 'Created At',
      key: 'studioCommission',
      dataIndex: 'createdAt',
      render(createdAt: Date) {
        return <span>{formatDate(createdAt)}</span>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Button type="primary" onClick={() => update(record)}>
          Update
        </Button>
      )
    }
  ];
  const dataSource = data.map((d) => ({ ...d, key: d._id }));
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      loading={searching}
      pagination={{ pageSize, total }}
      onChange={onChange}
      scroll={{ x: true }}
    />
  );
}

export default StudioCommissionsTable;
