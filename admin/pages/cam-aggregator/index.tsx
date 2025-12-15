import { TableListAggregator } from '@components/aggregator-category/table-list';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { aggregatorService } from '@services/aggregator.service';
import { message } from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';

class CamAggregator extends PureComponent {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    pagination: {
      onShowSizeChange: (current, pageSize) => {
        this.setState({
          limit: pageSize
        });
      }
    } as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc'
  };

  componentDidMount() {
    this.search();
  }

  handleTableChange = (pagination, _filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'createdAt',
      sort: sorter.order === 'ascend' ? 'asc' : 'desc'
    });
    this.search(pager.current);
  };

  async search(page = 1) {
    try {
      await this.setState({ searching: true });
      const resp = await aggregatorService.search({
        ...this.state.filter,
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      });
      await this.setState({
        searching: false,
        list: resp.data,
        pagination: {
          ...this.state.pagination,
          total: resp.data.total,
          pageSize: this.state.limit
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      await this.setState({ searching: false });
    }
  }

  render() {
    const { list, searching, pagination } = this.state;
    return (
      <>
        <Head>
          <title>Aggregator Categories</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Categories' }]} />
        <Page>
          <div style={{ marginBottom: '20px' }} />
          <TableListAggregator
            dataSource={list}
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

export default CamAggregator;
