import { getResponseError, getSearchData } from '@lib/utils';
import { Button, message } from 'antd';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { refundRequestService } from 'src/services';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Loader = dynamic(() => import('src/components/common/base/loader'), { ssr: false });
const RefundRequestTable = dynamic(() => import('src/components/refund-request/table-list'), { ssr: false });

function RefundRequestPage() {
  const [query, setQuery] = useState({
    pagination: {} as any,
    offset: 0,
    limit: 10,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);

  const getData = async () => {
    const {
      filter, limit, sort, sortBy, offset
    } = query;
    try {
      const resp = await refundRequestService.search({
        ...filter,
        limit,
        offset,
        sortBy,
        sort
      });
      await setRequests(resp.data.data);
      setTotal(resp.data.total);
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
    const oldState = query;
    await setQuery(getSearchData(pagination, filters, sorter, oldState));
    getData();
  };

  return (
    <div className="transaction-history-page">
      <PageTitle title="Refund request" />
      <PageHeader title="Refund Request" />
      <div>
        <div><Button><Link href="/account/user/refund-request/request"><a>New Request</a></Link></Button></div>
        {loading ? (
          <Loader />
        ) : (
          <RefundRequestTable
            rowKey="_id"
            requests={requests}
            pageSize={query.limit}
            total={total}
            onChange={onChange.bind(this)}
          />
        )}
      </div>
    </div>
  );
}

RefundRequestPage.authenticate = true;
RefundRequestPage.layout = 'primary';

export default RefundRequestPage;
