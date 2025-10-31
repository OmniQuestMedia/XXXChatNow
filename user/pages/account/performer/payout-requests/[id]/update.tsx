import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import { Moment } from 'moment';
import dynamic from 'next/dynamic';
import nextCookie from 'next-cookies';
import Error from 'pages/_error';
import { useState } from 'react';
import { PayoutRequestInterface } from 'src/interfaces';
import { payoutRequestService } from 'src/services';

import style from '../index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestForm = dynamic(() => import('@components/payout-request/form'), { ssr: false });

interface IProps {
  payout: PayoutRequestInterface;
}

function PayoutRequestCreatePage({
  payout
}: IProps) {
  if (!payout) return <Error statusCode={404} />;
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
      await payoutRequestService.update(payout._id, body);
      message.success('Success!');
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
      <PageHeader title="Update a Payout Request" />
      <PayoutRequestForm
        payout={payout}
        submit={submit.bind(this)}
        submitting={submitting}
      />
    </div>
  );
}

PayoutRequestCreatePage.authenticate = true;
PayoutRequestCreatePage.layout = 'primary';
PayoutRequestCreatePage.getInitialProps = async (ctx) => {
  try {
    const {
      query: { data, id }
    } = ctx;
    if (typeof window !== 'undefined' && data) {
      return {
        payout: JSON.parse(data)
      };
    }

    const { token } = nextCookie(ctx);
    const resp = await payoutRequestService.detail(id, {
      Authorization: token
    });
    return {
      payout: resp.data
    };
  } catch {
    return {};
  }
};

export default PayoutRequestCreatePage;
