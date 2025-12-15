import NumberFormat from '@components/common/layout/numberformat';
import { Table, Tag } from 'antd';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IStudio, IUser } from 'src/interfaces';
import { IEarning } from 'src/interfaces/earning';
import { capitalizeFirstLetter, formatDate } from 'src/lib';

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

function EarningHistoryTable({
  earnings,
  searching,
  total,
  pageSize,
  onChange,
  // eslint-disable-next-line camelcase
  role_data,
  singularTextModel = 'Performer'
}: IProps & PropsFromRedux) {
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
          sorter: true
        },
        {
          title: 'From',
          dataIndex: 'targetInfo',
          key: 'from',
          render: (targetInfo: IUser) => (targetInfo?.displayName || targetInfo?.username || 'N/A')
        },
        {
          title: 'To',
          dataIndex: 'sourceInfo',
          key: 'to',
          render: (sourceInfo: IUser) => sourceInfo?.username || 'N/A'
        },
        {
          title: 'Transaction Type',
          dataIndex: 'type',
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
              default:
                return <Tag>{type}</Tag>;
            }
          }
        },
        {
          title: 'Tokens Received',
          dataIndex: 'grossPrice',
          key: 'grossPrice',
          render: (grossPrice: number) => <NumberFormat value={grossPrice} />
        }
      ]
    },
    {
      title: 'Admin to Studio Transaction',
      className: 'admin-to-studio-transaction',
      style: { display: 'block' },
      children: [
        {
          title: 'Admin Earnings',
          children: [
            {
              title: '%',
              id: 'adPercent',
              dataIndex: 'commission',
              with: 50,
              render(commission: number) {
                return <span>{100 - commission}</span>;
              },
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Tks',
              id: 'adToken',
              with: 50,
              render: (_, record) => <NumberFormat value={((record.grossPrice - record.netPrice))} />,
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Amt',
              id: 'adAmount',
              with: 50,
              render: (_, record) => <NumberFormat value={((record.grossPrice - record.netPrice) * record.conversionRate)} />,
              onCell: () => ({ bordered: true })
            }
          ]
        },
        {
          title: `${capitalizeFirstLetter(role_data)} + ${singularTextModel} Share`,
          children: [
            {
              title: '%',
              id: 'smPercent',
              dataIndex: 'commission',
              with: 50,
              render(commission: number) {
                return <span>{commission}</span>;
              },
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Tks',
              id: 'smToken',
              dataIndex: 'netPrice',
              with: 50,
              render: (netPrice: number) => <NumberFormat value={netPrice} />,
              onCell: () => ({ bordered: true })
            },
            {
              title: 'Amt',
              id: 'smAmount',
              dataIndex: 'price',
              with: 50,
              render: (price: number) => <NumberFormat value={price} />,
              onCell: () => ({ bordered: true })
            }
          ]
        },
        {
          title: 'Payout from Admin',
          key: 'isPaid',
          dataIndex: 'payoutStatus',
          render: (payoutStatus: string) => {
            switch (payoutStatus) {
              case 'done': case 'paid': return <span>Paid</span>;
              case 'rejected': return <span>Rejected</span>;
              case 'pending': return <span>Pending</span>;
              case 'approved': return <span>Approved</span>;
              default: return <span>{payoutStatus}</span>;
            }
          },
          onCell: () => ({ bordered: true })
        }
      ]
    },
    {},
    {
      title: `Studio to ${singularTextModel} Transaction`,
      className: 'studio-to-model-transaction',
      style: { display: 'block' },
      children: [
        {
          title: 'Studio Earnings',
          children: [
            {
              title: '%',
              id: 'studioPercent',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              // eslint-disable-next-line no-unsafe-optional-chaining
              render: (studioToModel: IStudio) => 100 - studioToModel?.commission || 'N/A'
            },
            {
              title: 'Tks',
              id: 'studioToken',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              // eslint-disable-next-line no-mixed-operators, no-unsafe-optional-chaining
              render: (studioToModel: IStudio) => <NumberFormat value={(studioToModel?.grossPrice - studioToModel?.netPrice) || 'N/A'} />
            },
            {
              title: 'Amt',
              id: 'studioAmount',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              // eslint-disable-next-line no-mixed-operators, no-unsafe-optional-chaining
              render: (studioToModel: IStudio, record: IEarning) => <NumberFormat value={(studioToModel?.grossPrice - studioToModel?.netPrice) * record?.conversionRate || 'N/A'} />
            }
          ]
        },
        {
          title: `${singularTextModel} Earnings`,
          children: [
            {
              title: '%',
              id: 'modelPercent',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              render: (studioToModel: IStudio) => studioToModel?.commission || 'N/A'
            },
            {
              title: 'Tks',
              id: 'modelToken',
              with: 50,
              dataIndex: 'studioToModel',
              onCell: () => ({ bordered: true }),
              render: (studioToModel: IStudio) => <NumberFormat value={studioToModel?.netPrice || 'N/A'} />
            },
            {
              title: 'Amt',
              id: 'modelAmount',
              dataIndex: 'studioToModel',
              with: 50,
              onCell: () => ({ bordered: true }),
              // eslint-disable-next-line no-mixed-operators, no-unsafe-optional-chaining
              render: (studioToModel: IStudio, record: IEarning) => <NumberFormat value={(studioToModel?.netPrice) * record?.conversionRate || 'N/A'} />
            }
          ]
        },
        {
          title: `Payout to ${singularTextModel}`,
          key: 'modelPaid',
          dataIndex: 'studioToModel',
          // eslint-disable-next-line react/destructuring-assignment
          // render: (studioToModel: IStudio) => <span>{studioToModel?.payoutStatus === 'pending' ? 'Pending' : 'Paid'}</span>
          render: (studioToModel: IStudio) => <span>{studioToModel?.payoutStatus}</span>

        }
      ]
    }
  ] as any;
  const dataSource = earnings.map((p) => ({ ...p, key: p._id }));

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      className="table"
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

export default connector(EarningHistoryTable);
