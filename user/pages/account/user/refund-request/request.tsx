import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import { orderService, performerService, refundRequestService } from 'src/services';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const RefundRequestForm = dynamic(() => import('@components/refund-request/form'), { ssr: false });

function NewRefundRequestPage() {
  const [onSubmit, setOnSubmit] = useState(false);
  const [performers, setPerformers] = useState([]);
  const [selectedPerformerId, setSelectedPerformerId] = useState('');
  const [products, setProducts] = useState([]);

  const getPerformers = async () => {
    try {
      const resp = await (await performerService.search({ limit: 3000 })).data;
      resp && setPerformers(resp.data);
    } catch (e) {
      const err = Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  useEffect(() => {
    getPerformers();
  }, []);

  const onFinish = async (data) => {
    try {
      setOnSubmit(true);
      await refundRequestService.create(data);
      message.success('Your request has been sent');
      Router.back();
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setOnSubmit(false);
    }
  };

  const getProducts = async () => {
    try {
      if (!selectedPerformerId) { return; }
      const resp = await (await orderService.userSearch({ limit: 3000, deliveryStatus: 'delivered', performerId: selectedPerformerId })).data;
      resp && setProducts(resp.data);
    } catch (e) {
      const err = Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  const onChangePerformer = (performerId) => {
    setSelectedPerformerId(performerId);
    getProducts();
  };

  return (
    <div className="performer-videos-page">
      <PageTitle title="New refund request" />
      <PageHeader title="Refund request" />
      <RefundRequestForm
        onChangePerformer={onChangePerformer.bind(this)}
        loading={onSubmit}
        onFinish={onFinish.bind(this)}
        performers={performers}
        products={products}
      />
    </div>
  );
}

NewRefundRequestPage.authenticate = true;
NewRefundRequestPage.layout = 'primary';

export default NewRefundRequestPage;
