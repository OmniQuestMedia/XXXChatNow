import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/common/search-filter';
import { TableListMenu } from '@components/menu/table-list';
import { menuService } from '@services/menu.service';
import { message } from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';

interface IProps {
  performerId: string;
}

class Menus extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'ordering',
    sort: 'asc'
  };

  componentDidMount() {
    if (this.props.performerId) {
      this.setState({
        filter: {
          ...this.state.filter,
          ...{ performerId: this.props.performerId }
        }
      }, () => {
        this.search();
      });
    } else {
      this.search();
    }
  }

  handleTableChange = (pagination, _filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'ordering',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    });
    this.search(pager.current);
  };

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
  }

  async search(page = 1) {
    try {
      this.setState({ searching: true });
      const resp = await menuService.search({
        ...this.state.filter,
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      });

      this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...this.state.pagination,
          total: resp.data.total,
          pageSize: this.state.limit
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  async deleteMenu(id: string) {
    if (!window.confirm('Are you sure you want to delete this menu?')) {
      return;
    }
    try {
      await menuService.delete(id);
      message.success('Deleted successfully');
      await this.search(this.state.pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
  }

  render() {
    const { list, searching, pagination } = this.state;

    return (
      <>
        <Head>
          <title>Menus</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Menus' }]} />
        <Page>
          <SearchFilter onSubmit={this.handleFilter.bind(this)} />
          <div style={{ marginBottom: '20px' }} />
          <TableListMenu
            dataSource={list}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            deleteMenu={this.deleteMenu.bind(this)}
          />
        </Page>
      </>
    );
  }
}

export default Menus;
