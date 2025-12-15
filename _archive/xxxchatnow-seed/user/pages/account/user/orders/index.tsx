import { getResponseError, getSearchData } from '@lib/utils';
import { orderService } from '@services/index';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

interface IProps {
  // performerId: string;
}

const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PageTitle = dynamic(() => import('@components/common/page-title'));
const OrderSearchFilter = dynamic(() => import('@components/order').then((res) => res.OrderSearchFilter), { ssr: false });
const OrderTableList = dynamic(() => import('@components/order/table-list'), { ssr: false });

class UserOrderPage extends PureComponent<IProps> {
  static authenticate = true;

  static layout = 'primary';

  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: true,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc'
  };

  async componentDidMount() {
    this.search();
  }

  async handleTableChange(pagination, filters, sorter) {
    const pager = { ...pagination };
    const oldState = this.state;
    pager.current = pagination.current;
    await this.setState(getSearchData(pagination, filters, sorter, oldState));
    this.search(pager.current);
  }

  async handleFilter(filter) {
    await this.setState({ filter });
    this.search();
  }

  async search(page = 1) {
    const {
      filter, limit, sort, sortBy, pagination
    } = this.state;
    try {
      await this.setState({ searching: true });
      const resp = await orderService.userSearch({
        ...filter,
        limit,
        sort,
        sortBy,
        page
      });
      await this.setState({
        list: resp.data.data,
        pagination: {
          ...pagination,
          total: resp.data.total,
          pageSize: limit
        }
      });
    } catch (e) {
      const err = Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ searching: false });
    }
  }

  render() {
    const { list, searching, pagination } = this.state;
    const statuses = [
      {
        key: '',
        text: 'All'
      },
      {
        key: 'created',
        text: 'Created'
      },
      {
        key: 'processing',
        text: 'Processing'
      },
      {
        key: 'shipping',
        text: 'Shipping'
      },
      {
        key: 'delivered',
        text: 'Delivered'
      },
      {
        key: 'refunded',
        text: 'Refunded'
      }
    ];
    return (
      <div className="order-page">
        <PageTitle title="My Orders" />
        <PageHeader title="My Orders" />
        <div>
          <OrderSearchFilter
            statuses={statuses}
            onSubmit={this.handleFilter.bind(this)}
          />
          <br />
          <OrderTableList
            type="user"
            dataSource={list}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
          />
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(UserOrderPage);
