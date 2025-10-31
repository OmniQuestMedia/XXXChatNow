import { message } from 'antd';
import { Moment } from 'moment';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React from 'react';
import { payoutRequestService } from 'src/services';

import style from './index.module.less';

interface Props {}

interface States {
  submitting: boolean;
  // success: boolean;
}

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestForm = dynamic(() => import('@components/payout-request/form'), { ssr: false });

class PayoutRequestCreatePage extends React.PureComponent<Props, States> {
  static layout = 'primary';

  static authenticate = 'studio';

  constructor(props: Props) {
    super(props);
    this.state = {
      submitting: false
      // success: false
    };
  }

  async submit(data: {
    date: Moment[];
    paymentAccountType: string;
    requestNote: string;
  }) {
    if (!data.date[0] || !data.date[1]) return;

    try {
      this.setState({ submitting: true });
      const body = {
        paymentAccountType: data.paymentAccountType,
        requestNote: data.requestNote,
        sourceType: 'studio',
        fromDate: data.date[0],
        toDate: data.date[1]
      };
      await payoutRequestService.create(body, 'studio');
      message.success('Submitted request successfully!');
      Router.push('/studio/payout-requests');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error?.message || 'An error occurred, please try again later!');
    } finally {
      this.setState({ submitting: false });
    }
  }

  render() {
    const { submitting } = this.state;
    return (
      <div className={style['payout-request-page']}>
        <PageTitle title="Payout Request" />
        <PageHeader title="Create a Payout Request" />
        <PayoutRequestForm
          payout={{}}
          submit={this.submit.bind(this)}
          submitting={submitting}
            // eslint-disable-next-line jsx-a11y/aria-role
          role="studio"
        />
      </div>
    );
  }
}

export default PayoutRequestCreatePage;
