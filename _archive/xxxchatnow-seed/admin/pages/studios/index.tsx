import { DownOutlined, EditOutlined } from '@ant-design/icons';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/studio/search-filter';
import { formatDate } from '@lib/date';
import { studioService } from '@services/index';
import {
  Button, Dropdown, Menu, message, Table, Tag
} from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { PureComponent } from 'react';

interface Props {
  status: string;
}

class Studios extends PureComponent<Props> {
  static async getInitialProps(ctx) {
    return { ...ctx.query };
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [],
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc'
  };

  componentDidMount() {
    const { status } = this.props;
    this.search(1, status);
  }

  componentDidUpdate(prevProps) {
    const { status } = this.props;
    if (status !== prevProps.status) {
      this.search();
    }
  }

  async handleTableChange(pagination, _filters, sorter) {
    // eslint-disable-next-line
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    });
    this.search(pager.current);
  }

  handleFilter(filter) {
    this.setState({ filter }, () => {
      this.search();
    });
  }

  async search(page = 1, status = '') {
    try {
      this.setState({ searching: true });
      const { filter } = this.state;
      if (status) {
        filter.status = status;
      }
      const query = {
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        ...filter,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      };
      const resp = await studioService.search(query);
      this.setState({
        filter,
        searching: false,
        list: resp.data.data,
        pagination: {
          // eslint-disable-next-line
          ...this.state.pagination,
          pageSize: this.state.limit,
          total: resp.data.total
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  render() {
    const { list, searching, pagination } = this.state;
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        sorter: true,
        fixed: 'left' as 'left'
      },
      {
        title: 'Username',
        dataIndex: 'username',
        sorter: true,
        fixed: 'left' as 'left'
      },
      {
        title: 'Email',
        dataIndex: 'email',
        sorter: true
      },
      {
        title: 'Total Models',
        key: 'totalModels',
        render: ({ _id, stats }) => (
          <Link href={`/performer?studioId=${_id}`}>
            <a>
              View
              {' '}
              {stats.totalPerformer}
              {' '}
              model(s)
            </a>
          </Link>
        )
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status) {
          switch (status) {
            case 'active':
              return <Tag color="green">Active</Tag>;
            case 'inactive':
              return <Tag color="red">Suspend</Tag>;
            case 'pending-email-confirmation':
              return <Tag color="default">Pending</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      {
        title: 'Email Verified',
        dataIndex: 'emailVerified',
        render(emailVerified: boolean) {
          if (emailVerified) return <Tag color="green">Yes</Tag>;
          return <Tag color="red">No</Tag>;
        }
      },
      {
        title: 'Balance',
        dataIndex: 'balance',
        key: 'balance',
        render: (balance: number) => balance.toFixed(2),
        sorter: true
      },
      {
        title: 'CreatedAt',
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
        render(id: string) {
          return (
            <Dropdown
              overlay={(
                <Menu>
                  <Menu.Item key="edit">
                    <Link
                      href={{
                        pathname: '/studios/update',
                        query: { id }
                      }}
                      as={`/studios/update?id=${id}`}
                    >
                      <a>
                        <EditOutlined />
                        {' '}
                        Update
                      </a>
                    </Link>
                  </Menu.Item>
                </Menu>
              )}
            >
              <Button>
                Actions
                {' '}
                <DownOutlined />
              </Button>
            </Dropdown>
          );
        }
      }
    ];
    return (
      <>
        <Head>
          <title>Studios</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Studios' }
          ]}
        />
        <Page>
          <SearchFilter
            onSubmit={this.handleFilter.bind(this)}
          />
          <div style={{ marginBottom: '20px' }} />
          <Table
            dataSource={list}
            columns={columns}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            scroll={{ x: 700, y: 650 }}
          />
        </Page>
      </>
    );
  }
}

export default Studios;
