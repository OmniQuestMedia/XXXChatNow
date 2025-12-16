import { DownOutlined, EditOutlined } from '@ant-design/icons';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/user/search-filter';
import {
  convertMiliSecsToSecs, convertSecondsToSecs, formatDate
} from '@lib/date';
import { downloadCsv } from '@lib/utils';
import { userService } from '@services/index';
import {
  Button, Dropdown, Menu, message, Table, Tag
} from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { PureComponent } from 'react';
import { IUser } from 'src/interfaces';

interface IProps {
  status: string;
}

class Users extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    return ctx.query;
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
    if (this.props !== prevProps) {
      const { status } = this.props;
      this.search(1, status);
    }
  }

  async handleTableChange(pagination, filters, sorter) {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    });
    this.search(pager.current);
  }

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
  }

  async onExportCsv(filter) {
    try {
      const page = 1;
      this.setState({ filter });
      const url = userService.exportCsv({
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        ...this.state.filter,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      });
      const resp = (await downloadCsv(url, 'users_export.csv')) as any;
      if (resp && resp.success) {
        message.success('Downloading, please check in Download folder');
      }
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  }

  async search(page = 1, status = '') {
    try {
      const { filter } = this.state;
      this.setState({ searching: true });
      if (status) {
        filter.status = status;
      }

      const query = {
        ...filter,
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      };
      const resp = await userService.search(query);
      this.setState({
        filter,
        searching: false,
        list: resp.data.data,
        pagination: {
          ...this.state.pagination,
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
    const { status: statusQ } = this.props;
    const columns = [
      {
        title: 'First name',
        dataIndex: 'firstName',
        sorter: true,
        fixed: 'left' as 'left'
      },
      {
        title: 'Last name',
        dataIndex: 'lastName',
        sorter: true,
        fixed: 'left' as 'left'
      },
      {
        title: 'Username',
        dataIndex: 'username',
        sorter: true
      },
      {
        title: 'Email',
        dataIndex: 'email',
        sorter: true
      },
      {
        title: 'Roles',
        dataIndex: 'roles',
        render(roles, record) {
          return (
            <>
              {roles.map((role) => {
                switch (role) {
                  case 'admin': return <Tag color="red" key={`admin-${record._id}`}>{role}</Tag>;
                  case 'user': return <Tag color="geekblue" key={record._id}>{role}</Tag>;
                  default: return <Tag color="default" key={record._id}>{role}</Tag>;
                }
              })}
            </>
          );
        }
      },
      {
        title: 'Gender',
        dataIndex: 'gender'
      },
      {
        title: 'Amount spent',
        dataIndex: '_id',
        render(_, record: IUser) {
          return <span>{record?.stats?.totalTokenSpent || 0}</span>;
        }
      },
      {
        title: 'Balance',
        dataIndex: 'balance',
        sorter: true
      },
      {
        title: 'Email Verified',
        dataIndex: 'emailVerified',
        render(emailVerified) {
          if (emailVerified) return <Tag color="green">Y</Tag>;
          return <Tag color="red">N</Tag>;
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status) {
          switch (status) {
            case 'active':
              return <Tag color="green">Active</Tag>;
            case 'inactive':
              return <Tag color="red">Inactive</Tag>;
            case 'pending-email-confirmation':
              return <Tag color="default">Pending</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      {
        title: 'Total view stream time (HH:mm:ss)',
        dataIndex: '_id',
        render(data, record: IUser) {
          return (
            <span>
              {record?.stats?.totalViewTime
                && convertMiliSecsToSecs(record?.stats?.totalViewTime || 0)}
            </span>
          );
        }
      },
      {
        title: 'Total online time (HH:mm)',
        dataIndex: 'totalOnlineTime',
        render(time: number) {
          return <span>{convertSecondsToSecs(time || 0)}</span>;
        }
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
                        pathname: '/users/update',
                        query: { id }
                      }}
                      as={`/users/update?id=${id}`}
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
          <title>Users</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Users' }
          ]}
        />
        <Page>
          <SearchFilter
            onSubmit={this.handleFilter.bind(this)}
            onExportCsv={this.onExportCsv.bind(this)}
            defaultValues={{ status: statusQ }}
          />
          <div style={{ marginBottom: '20px' }} />
          <Table
            dataSource={list}
            columns={columns}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            scroll={{ x: 1500, y: 650 }}
          />
        </Page>
      </>
    );
  }
}

export default Users;
