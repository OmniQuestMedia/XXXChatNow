import { OrderSearchFilter } from '@components/order';
import { orderService } from '@services/index';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { getSearchData } from 'src/lib/utils';

const OrderTableList = dynamic(() => import('@components/order/table-list'), { ssr: false });
const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

function ModelOrderPage() {
  const [query, setQuery] = useState({
    pagination: {} as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc'
  });
  const [searching, setSearching] = useState(false);
  const [list, setList] = useState([]) as any;
  const [statuses] = useState([
    {
      key: '',
      text: 'All'
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
  ]);

  const search = async (page = 1) => {
    const {
      filter, limit, sort, sortBy
    } = query;

    try {
      await setSearching(true);
      const resp = await orderService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      await setSearching(false);
      await setList(resp.data.data);
    } catch (e) {
      message.error('An error occurred, please try again!');
      await setSearching(false);
    }
  };

  useEffect(() => {
    search();
  }, [query]);

  const handleTableChange = async (pagination, filters, sorter) => {
    const pager = { ...pagination };
    const oldState = { query };
    pager.current = pagination.current;
    await setQuery(getSearchData(pagination, filters, sorter, oldState));
    search(pager.current);
  };

  const handleFilter = async (filter) => {
    setQuery((state) => ({ ...state, filter }));
  };

  return (
    <div className="transaction-history-page">
      <PageTitle title="My Orders" />
      <PageHeader title="My Orders" />
      <div>
        <OrderSearchFilter
          statuses={statuses}
          onSubmit={handleFilter.bind(this)}
        />
        <br />
        <OrderTableList
          type="performer"
          dataSource={list}
          rowKey="_id"
          loading={searching}
          pagination={query.pagination}
          onChange={handleTableChange.bind(this)}
        />
      </div>
    </div>
  );
}

ModelOrderPage.authenticate = true;
ModelOrderPage.layout = 'primary';
ModelOrderPage.getInitialProps = (ctx) => ctx.query;

const mapStates = (state: any) => ({
  ui: state.ui
});
export default connect(mapStates)(ModelOrderPage);
