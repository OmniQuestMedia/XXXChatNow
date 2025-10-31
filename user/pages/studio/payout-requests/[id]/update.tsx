import { redirect } from '@lib/utils';
import { message } from 'antd';
import { Moment } from 'moment';
import dynamic from 'next/dynamic';
import nextCookie from 'next-cookies';
import React from 'react';
import { PayoutRequestInterface } from 'src/interfaces';
import { payoutRequestService } from 'src/services';

import style from '../index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestForm = dynamic(() => import('@components/payout-request/form'), { ssr: false });

interface Props {
  payout: PayoutRequestInterface;
}

interface States {
  submitting: boolean;
}

class PayoutRequestCreatePage extends React.PureComponent<Props, States> {
  static layout = 'primary';

  static authenticate = 'studio';

  static async getInitialProps(ctx) {
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
      const resp = await payoutRequestService.detail(
        id,
        {
          Authorization: token
        },
        'studio'
      );
      return {
        payout: resp.data
      };
    } catch (e) {
      return redirect('/404', ctx);
    }
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      submitting: false
    };
  }

  async submit(data: {
    date: Moment[];
    paymentAccountType: string;
    requestNote: string;
  }) {
    if (!data.date[0] || !data.date[1]) return;
    const { payout } = this.props;

    try {
      this.setState({ submitting: true });
      const body = {
        paymentAccountType: data.paymentAccountType,
        requestNote: data.requestNote,
        fromDate: data.date[0],
        toDate: data.date[1]
      };
      await payoutRequestService.update(payout._id, body, 'studio');
      message.success('Updated request successfully!');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || 'An error occurred, please try again later!');
    } finally {
      this.setState({ submitting: false });
    }
  }

  render() {
    const { payout } = this.props;
    const { submitting } = this.state;

    return (
      <div className={style['payout-request-page']}>
        <PageTitle title="Payout request" />
        <PageHeader title="Update a Payout Request" />
        <PayoutRequestForm
          payout={payout}
          submit={this.submit.bind(this)}
          submitting={submitting}
        />
      </div>
    );
  }
}

export default PayoutRequestCreatePage;
