import { getSearchData } from '@lib/utils';
import { omit } from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { getPaymentTokenHistroy } from 'src/redux/user/actions';
import { productService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PaymentTokenHistoryTable = dynamic(() => import('@components/user/payment-token-history-table'), { ssr: false });

function PaymentTokenHistory() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [initialQuery, setInittialQuery] = useState({
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc'
  });

  const getData = async () => {
    const query = omit(initialQuery, ['data', 'total', 'loading']);
    await setSearching(true);
    try {
      const resp = await productService.purchased({ ...query });
      setTotal(resp.data.total);
      setData(resp.data.data);
    } catch (e) {
      return {};
    } finally { await setSearching(false); }
    return {};
  };

  // const onDateChange = async (_, dateStrings: string[]) => {
  //   const oldState = initialQuery;
  //   await setInittialQuery({
  //     ...oldState,
  //     fromDate: dateStrings[0],
  //     toDate: dateStrings[1]
  //   });
  //   getData();
  // };

  useEffect(() => {
    getData();
  }, []);

  const onChange = async (pagination, filters, sorter) => {
    const oldState = initialQuery;
    await setInittialQuery(getSearchData(pagination, filters, sorter, oldState));
    getData();
  };

  const paymentHistoryprops = {
    paymentTokenHistory: data,
    total,
    onChange: onChange.bind(this),
    pageSize: initialQuery.limit,
    searching
  };
  return (
    <div className={style['purchased-product']}>
      <PageTitle title="My Purchased Products" />
      <PageHeader title="Purchased Products" />
      {/* <div className="ant-page-header">
        <DatePicker.RangePicker onChange={onDateChange.bind(this)} />
      </div> */}
      <PaymentTokenHistoryTable {...paymentHistoryprops} />
    </div>
  );
}

PaymentTokenHistory.authenticate = true;
PaymentTokenHistory.layout = 'primary';

const mapStateToProps = (state) => ({ ...state.user.paymentTokenHistory });
const mapDispatch = { getPaymentTokenHistroy };
export default connect(mapStateToProps, mapDispatch)(PaymentTokenHistory);
