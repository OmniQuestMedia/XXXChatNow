import { getResponseError, getSearchData } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ITransaction } from 'src/interfaces';
import { transactionService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Loader = dynamic(() => import('src/components/common/base/loader'), { ssr: false });
const TransactionHistoryTable = dynamic(() => import('src/components/transaction/table-list'), { ssr: false });

function TransactionHistoryPage() {
  const [query, setQuery] = useState({
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc',
    filter: {}
  });
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState([] as ITransaction[]);
  const [total, setTotal] = useState(0);

  const getData = async () => {
    const {
      filter, limit, offset, sortBy, sort
    } = query;
    try {
      const resp = await transactionService.search({
        ...filter,
        limit,
        offset,
        sortBy,
        sort
      });
      await setTransaction(resp.data.data);
      await setTotal(resp.data.total);
    } catch (e) {
      const err = Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const onChange = async (pagination, filters, sorter) => {
    await setQuery(getSearchData(pagination, filters, sorter, query));
    getData();
  };
  return (
    <div className={style['transaction-history-page']}>
      <PageTitle title="Transaction History" />
      <PageHeader title="Transaction History" />
      <div>
        {loading ? (
          <Loader />
        ) : (
          <TransactionHistoryTable
            rowKey="_id"
            transactions={transaction}
            pageSize={query.limit}
            total={total}
            onChange={onChange.bind(this)}
          />
        )}
      </div>
    </div>
  );
}

TransactionHistoryPage.authenticate = true;
TransactionHistoryPage.layout = 'primary';

export default TransactionHistoryPage;
