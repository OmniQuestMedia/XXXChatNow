import { DeleteOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Breakpoint } from 'src/lib';

interface IProps {
  commissions: any;
  searching: boolean;
  total: number;
  pageSize: number;
  onChange(pagination, filters, sorter, extra): Function;
  deleteCommission(id: string): Function;
}

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

const breakPoint: Breakpoint[] = ['md'];

function EarningHistoryTable({
  commissions,
  searching,
  total,
  pageSize,
  onChange,
  deleteCommission,
  singularTextModel = 'Performer'
}: IProps & PropsFromRedux) {
  const columns = [
    {
      title: singularTextModel,
      dataIndex: 'performer',
      key: 'performer',
      responsive: breakPoint
    },
    {
      title: '(%) Commission',
      dataIndex: 'commission',
      key: 'performer'
    },
    {
      title: 'Active Date',
      key: 'activeDate',
      dataIndex: 'activeDate'
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id: string) => (
        <span>
          <DeleteOutlined onClick={() => deleteCommission(id)} />
        </span>
      )
    }
  ];
  const dataSource = commissions.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
      pagination={{
        total,
        pageSize
      }}
      scroll={{ x: true }}
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange}
    />
  );
}

export default connector(EarningHistoryTable);
