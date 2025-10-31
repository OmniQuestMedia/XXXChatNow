/* eslint-disable react/destructuring-assignment */
import NumberFormat from '@components/common/layout/numberformat';
import { Table, Tag } from 'antd';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IUser } from 'src/interfaces';
import { IEarning } from 'src/interfaces/earning';
import { capitalizeFirstLetter, formatDate } from 'src/lib';

import style from './earning-studio-operated-table.module.less';

interface IProps {
  earnings: IEarning[];
  searching: boolean;
  total: number;
  pageSize: number;
  onChange(pagination, filters, sorter, extra): Function;
  // eslint-disable-next-line camelcase
  role_data: 'model' | 'studio';
}

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

const customCell = ({ children, bordered }) => <td style={{ border: bordered ? '1px solid var(--border-color)' : 'none' }}>{children}</td>;

function EarningStudioOperatedTable({
  earnings,
  searching,
  total,
  pageSize,
  onChange,
  // eslint-disable-next-line camelcase
  role_data,
  singularTextModel = 'Performer'
}: IProps & PropsFromRedux) {
  // const fixed = dataSource?.length > 0;
  const columns = [
    {
      title: 'Reference',
      dataIndex: 'transactionTokenId',
      key: 'transactionTokenId',
      render: (transactionTokenId) => transactionTokenId?.slice(16, 24).toUpperCase() || 'N/A',
      fixed: 'left'
    },
    {
      title: '',
      children: [
        {
          title: 'Date',
          key: 'createdAt',
          dataIndex: 'createdAt',
          render: (createdAt: Date) => <span>{formatDate(createdAt)}</span>,
          with: 100,
          sorter: true
        },
        {
          title: 'From',
          dataIndex: 'sourceInfo',
          key: 'from',
          with: 100,
          render: (sourceInfo: IUser) => (sourceInfo?.displayName || sourceInfo?.username || 'N/A')
        },
        {
          title: 'To',
          dataIndex: 'targetInfo',
          key: 'to',
          with: 100,
          render: (targetInfo: IUser) => targetInfo?.username || 'N/A'
        },
        {
          title: 'Transaction Type',
          dataIndex: 'type',
          with: 200,
          key: 'type',
          render(type: string) {
            switch (type) {
              case 'sale_video':
                return <Tag color="magenta">Sale Video</Tag>;
              case 'sale_product':
                return <Tag color="volcano">Sale Product</Tag>;
              case 'sale_photo':
                return <Tag color="orange">Sale Photo</Tag>;
              case 'tip':
                return <Tag color="gold">Tip</Tag>;
              case 'stream_private':
                return <Tag color="blue">Private</Tag>;
              case 'stream_group':
                return <Tag color="green">Group</Tag>;
              case 'spin_wheel':
                return <Tag color="red">Wheel</Tag>;
              default:
                return <Tag>{type}</Tag>;
            }
          }
        },
        {
          title: 'Tokens Received',
          key: 'grossPrice',
          with: 100,
          render: (_, record) => <NumberFormat value={record.originalPrice} />
        },
        // {
        //   title: 'Net Price',
        //   dataIndex: 'netPrice',
        //   key: 'netPrice',
        //   render: (netPrice: number) => <NumberFormat value={netPrice} />,
        //   sorter: true
        // },
        {
          title: 'Conversion Rate',
          dataIndex: 'conversionRate',
          with: 100,
          key: 'conversionRate'
        }
        // {
        //   title: `${capitalizeFirstLetter(role_data)} Earning Money`,
        //   dataIndex: 'price',
        //   key: 'price',
        //   render: (price: number) => <NumberFormat value={price} />
        // },
        // {
        //   title: `${capitalizeFirstLetter(role_data)} Commission`,
        //   dataIndex: 'commission',
        //   key: 'commission',
        //   render: (commission: number) => <NumberFormat value={commission} suffix="%" />
        // },
      ]
    },
    {
      title: 'Admin to Studio Transaction',
      className: style['admin-to-studio-transaction'],
      style: { display: 'block' },
      children: [
        {
          title: 'Admin Earnings',
          children: [
            {
              title: '%',
              id: 'adPercent',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              render: (_, record) => 100 - ((record.grossPrice * 100) / record.originalPrice) || 'N/A'
            },
            {
              title: 'Tks',
              id: 'adToken',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              render: (_, record) => <NumberFormat value={(record.originalPrice * (100 - ((record.grossPrice * 100) / record.originalPrice))) / 100 || 'N/A'} />
            },
            {
              title: 'Amt',
              id: 'adAmount',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              render: (_, record) => <NumberFormat value={((record.originalPrice * (100 - ((record.grossPrice * 100) / record.originalPrice))) / 100) * record.conversionRate || 'N/A'} />
            }
          ]
        },
        {
          title: ` Studio + ${capitalizeFirstLetter(role_data)} Share`,
          children: [
            {
              title: '%',
              id: 'smPercent',
              with: 50,
              onCell: () => ({ bordered: true }),
              render: (_, record) => ((record.grossPrice * 100) / record.originalPrice) || 'N/A'
            },
            {
              title: 'Tks',
              id: 'smToken',
              with: 50,
              onCell: () => ({ bordered: true }),
              render: (_, record) => <NumberFormat value={(record.originalPrice * ((record.grossPrice * 100) / record.originalPrice)) / 100 || 'N/A'} />
            },
            {
              title: 'Amt',
              id: 'smAmount',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              render: (_, record) => <NumberFormat value={((record.originalPrice * ((record.grossPrice * 100) / record.originalPrice)) / 100) * record.conversionRate || 'N/A'} />
            }
          ]
        }
      ]
    },
    {
    },
    {
      title: `Studio to ${singularTextModel} Transaction`,
      className: style['studio-to-model-transaction'],
      style: { display: 'block' },
      children: [
        {
          title: 'Studio Earnings',
          children: [
            {
              title: '%',
              id: 'studioPercent',
              dataIndex: 'commission',
              with: 50,
              render(commission: number) {
                return <span>{100 - commission}</span>;
              },
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Tks',
              id: 'studioToken',
              with: 50,
              render: (_, record) => <NumberFormat value={((record.grossPrice - record.netPrice))} />,
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Amt',
              id: 'studioAmount',
              with: 50,
              render: (_, record) => <NumberFormat value={((record.grossPrice - record.netPrice) * record.conversionRate)} />,
              onCell: () => ({ bordered: true })
            }
          ]
        },
        {
          title: `${singularTextModel} Earnings`,
          children: [
            {
              title: '%',
              id: 'modelPercent',
              dataIndex: 'commission',
              with: 50,
              render(commission: number) {
                return <span>{commission}</span>;
              },
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Tks',
              id: 'modelToken',
              dataIndex: 'netPrice',
              with: 50,
              render: (netPrice: number) => <NumberFormat value={netPrice} />,
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Amt',
              id: 'modelAmount',
              dataIndex: 'price',
              with: 50,
              render: (price: number) => <NumberFormat value={price} />,
              onCell: () => ({ bordered: true })
            }
          ]
        },
        {
          title: `Payout to ${singularTextModel}`,
          key: 'modelPaid',
          dataIndex: 'payoutStatus',
          // render: (payoutStatus: string) => <span>{payoutStatus === 'pending' ? 'Pending' : 'Paid'}</span>,
          render: (payoutStatus: string) => <span>{payoutStatus}</span>,
          onCell: () => ({ bordered: true })
        }
      ]
    }
  ] as any;
  const dataSource = earnings.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className={style['studio-earnings-table']}
      pagination={{
        total,
        pageSize,
        showSizeChanger: false,
        position: ['bottomCenter']
      }}
      scroll={{ x: 2400 }}
      showSorterTooltip={false}
      loading={searching}
      onChange={onChange}
      bordered
      components={{
        body: {
          cell: customCell
        }
      }}
      locale={{
        emptyText: 'No data'
      }}
    />
  );
}

export default connector(EarningStudioOperatedTable);
