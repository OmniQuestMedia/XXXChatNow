import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import { Moment } from 'moment';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { useState } from 'react';
import { payoutRequestService } from 'src/services';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestForm = dynamic(() => import('@components/payout-request/form'), { ssr: false });

function PayoutRequestCreatePage() {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (data: {
    date: Moment[];
    paymentAccountType: string;
    requestNote: string;
  }) => {
    if (!data.date[0] || !data.date[1]) return;

    try {
      setSubmitting(true);
      const body = {
        paymentAccountType: data.paymentAccountType,
        requestNote: data.requestNote,
        sourceType: 'performer',
        fromDate: data.date[0],
        toDate: data.date[1]
      };
      await payoutRequestService.create(body);
      message.success('Payout requested, please wait for the admin approval');
      Router.push('/account/performer/payout-requests');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className={style['payout-request-page']}>
      <PageTitle title="Payout request" />
      <PageHeader title="Create a Payout Request" />
      <PayoutRequestForm
        payout={{}}
        submit={submit.bind(this)}
        submitting={submitting}
      />
    </div>
  );
}

PayoutRequestCreatePage.authenticate = true;
PayoutRequestCreatePage.layout = 'primary';

export default PayoutRequestCreatePage;
