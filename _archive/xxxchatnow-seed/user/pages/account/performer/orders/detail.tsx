import { getResponseError } from '@lib/utils';
import {
  message
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import { orderService } from 'src/services';

const FormOrder = dynamic(() => import('@components/order/form-order'), { ssr: false });
const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

interface IProps {
  id: string;
}

function ModelOrderDetailPage({
  id
}: IProps) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      const resp = await orderService.details(id);
      setOrder(resp.data);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || 'An error occurred, please try again later!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const submit = async ({ shippingCode, deliveryStatus }) => {
    if (!shippingCode) {
      message.error('Missing shipping code');
      return;
    }
    try {
      setUpdating(true);
      await orderService.update(id, {
        deliveryStatus,
        shippingCode
      });
      message.success('Changes saved.');
      Router.back();
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setUpdating(false);
    }
  };
  return (
    <>
      <PageTitle title={`My Order - ${order?.orderNumber}`} />
      <PageHeader title="Order detail" />
      <FormOrder
        order={order}
        loading={loading}
        isUpdating={isUpdating}
        onFinish={submit.bind(this)}
        disableUpdate={false}
      />
    </>
  );
}

ModelOrderDetailPage.authenticate = true;
ModelOrderDetailPage.layout = 'primary';
ModelOrderDetailPage.getInitialProps = (ctx) => ctx.query;

export default ModelOrderDetailPage;
