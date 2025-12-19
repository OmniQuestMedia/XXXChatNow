import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/post/search-filter';
import { formatDate } from '@lib/date';
import { postService } from '@services/post.service';
import {
  Button, Dropdown, Menu, message, Table, Tag
} from 'antd';
import getConfig from 'next/config';
import Head from 'next/head';
import Link from 'next/link';
import { PureComponent } from 'react';
import { IPost } from 'src/interfaces';

class Posts extends PureComponent {
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
    this.search();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    });
    this.search(pager.current);
  };

  handleFilter(filter) {
    this.setState({ filter }, () => {
      this.search();
    });
  }

  async search(page = 1) {
    try {
      this.setState({ searching: true });
      const resp = await postService.search({
        ...this.state.filter,
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        sortBy: this.state.sortBy,
        sort: this.state.sort
      });
      this.setState({
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

  async deletePost(id: string) {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      await postService.delete(id);
      await this.search(this.state.pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
  }

  render() {
    const { publicRuntimeConfig } = getConfig();
    const siteUrl = publicRuntimeConfig.SITE_URL;
    const { list, searching, pagination } = this.state;
    const columns = [
      {
        title: 'Title',
        dataIndex: 'title',
        sorter: true,
        render(data, record) {
          return (
            <>
              <Link
                href={{
                  pathname: '/posts/update',
                  query: {
                    id: record._id
                  }
                }}
              >
                <a style={{ fontWeight: 'bold' }}>{record.title}</a>
              </Link>
              {/* <small>{record.shortDescription}</small> */}
            </>
          );
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        sorter: true,
        render(status: string) {
          let color = 'default';
          switch (status) {
            case 'published':
              color = 'green';
              break;
            default: break;
          }
          return (
            <Tag color={color} key={status}>
              {status.toUpperCase()}
            </Tag>
          );
        }
      },
      {
        title: 'Last update',
        dataIndex: 'updatedAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Actions',
        dataIndex: '_id',
        render: (id: string, record: IPost) => (
          <Dropdown
            overlay={(
              <Menu>
                <Menu.Item key="view-url">
                  <a target="_blank" href={`${siteUrl}/page/${record.slug}`} rel="noreferrer">
                    <EyeOutlined />
                    {' '}
                    View
                    {' '}
                  </a>
                </Menu.Item>
                <Menu.Item key="edit">
                  <Link
                    href={{
                      pathname: '/posts/update',
                      query: { id }
                    }}
                    as={`/posts/update?id=${id}`}
                  >
                    <a>
                      <EditOutlined />
                      {' '}
                      Update
                    </a>
                  </Link>
                </Menu.Item>
                <Menu.Item
                  key="delete"
                  onClick={() => this.deletePost(id)}
                >
                  <span>
                    <DeleteOutlined />
                    {' '}
                    Delete
                  </span>
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
        )
      }
    ];
    return (
      <>
        <Head>
          <title>Static page</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Static pages' }]} />
        <Page>
          <SearchFilter onSubmit={this.handleFilter.bind(this)} />
          <div style={{ marginBottom: '20px' }} />
          <Table
            dataSource={list}
            columns={columns}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
          />
        </Page>
      </>
    );
  }
}

export default Posts;
