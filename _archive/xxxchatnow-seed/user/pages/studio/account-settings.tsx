import { getResponseError } from '@lib/utils';
import { paymentInformationService } from '@services/payment-information.service';
import { Collapse, message, Tabs } from 'antd';
import { omit } from 'lodash';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  ICountry,
  IStudio,
  IUpdatePasswordFormData,
  PAYMENT_ACCOUNT
} from 'src/interfaces';
import { updatePassword } from 'src/redux/auth/actions';
import {
  updateStudio,
  updateStudioBitpay,
  updateStudioDirectDeposit,
  updateStudioPaxum,
  updateStudioPaymentInfo
} from 'src/redux/studio/actions';

const { Panel } = Collapse;

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PasswordChange = dynamic(() => import('@components/auth/password-change'), { ssr: false });
const CommissionCard = dynamic(() => import('@components/commission/commission-card'), { ssr: false });
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const BitpaySettigForm = dynamic(() => import('@components/payment').then((res) => res.BitpaySettigForm), { ssr: false });
const DirectDepositSettingForm = dynamic(() => import('@components/payment/direct-deposit-form').then((res) => res.DirectDepositSettingForm), { ssr: false });
const IssueCheckUSSetingForm = dynamic(() => import('@components/payment/issue-check-us-setting-form').then((res) => res.IssueCheckUSSetingForm), { ssr: false });
const PaxumSettingForm = dynamic(() => import('@components/payment/paxum-form').then((res) => res.PaxumSettingForm), { ssr: false });
const PaypalSettingFrom = dynamic(() => import('@components/payment/paypal-setting-form').then((res) => res.PaypalSettingFrom), { ssr: false });
const WireTransferSettingForm = dynamic(() => import('@components/payment/wire-transfer-setting-form').then((res) => res.WireTransferSettingForm), { ssr: false });
const StudioInformation = dynamic(() => import('@components/studio/account-information'), { ssr: false });

const ROLE_STUDIO = 'studio';

interface P {
  studio: IStudio;
  action: string;
  auth: any;
  updateStudio: Function;
  updateStudioPaymentInfo: Function;
  updateStudioDirectDeposit: Function;
  updateStudioBitpay: Function;
  updateStudioPaxum: Function;
  updatePassword: Function;
  updating: boolean;
  success: boolean;
  errorInfo: any;
  countries: ICountry[];
}

interface S {
  paymentInformationKey: string;
  paymentInformation: Record<string, any>;
}

class StudioProfilePage extends PureComponent<P, S> {
  static authenticate = 'studio';

  static layout = 'primary';

  static getInitialProps(ctx) {
    const { query } = ctx;
    return {
      action: query.action
    };
  }

  constructor(props: P) {
    super(props);
    this.state = {
      paymentInformationKey: '',
      paymentInformation: {}
    };
  }

  componentDidUpdate(prevProps: P, prevStates: S) {
    const { success, errorInfo, auth } = this.props;
    const { paymentInformationKey } = this.state;
    if (prevProps.success !== success && success) {
      message.success('Update Profile Success.');
    }

    if (prevProps.errorInfo !== errorInfo && errorInfo) {
      message.error(getResponseError(errorInfo));
    }

    if (
      prevProps.auth.updatePassword.success !== auth.updatePassword.success
      && auth.updatePassword.success
    ) {
      message.success('Update Password Success.');
    }

    if (
      prevProps.auth.updatePassword.error !== auth.updatePassword.error
      && auth.updatePassword.error
    ) {
      message.error(getResponseError(auth.updatePassword.error));
    }

    if (
      paymentInformationKey
      && paymentInformationKey !== prevStates.paymentInformationKey
    ) {
      this.getPaymentInformation();
    }
  }

  onTabsChange(key: string) {
    Router.push(
      {
        pathname: '/studio/account-settings',
        query: { action: key }
      },
      `/studio/account-settings?action=${key}`,
      { shallow: false }
    );
  }

  onFinish(data) {
    const { studio, updateStudio: dispatchUpdateStudio } = this.props;
    dispatchUpdateStudio({
      ...omit(studio, ['bankTransferOption', 'bitpay']),
      ...data
    });
  }

  onPasswordChange(data: IUpdatePasswordFormData) {
    const { updatePassword: dispatchUpdatePassword } = this.props;
    dispatchUpdatePassword({ source: 'studio', ...data });
  }

  onPaymentInformationChange(key: string) {
    this.setState({ paymentInformationKey: key });
  }

  async getPaymentInformation() {
    const { paymentInformationKey } = this.state;
    paymentInformationService
      .findOne({ type: paymentInformationKey })
      .then((resp) => this.setState({
        paymentInformation: { [paymentInformationKey]: resp.data }
      }));
  }

  async submitPaymentInfoForm(data) {
    try {
      const { paymentInformationKey } = this.state;
      const resp = await paymentInformationService.create({
        type: paymentInformationKey,
        ...data
      });
      this.setState({
        paymentInformation: { [paymentInformationKey]: resp.data }
      });
      message.success('Update Payment Information Success');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  render() {
    const {
      action, updating, studio, countries
    } = this.props;
    const { paymentInformation } = this.state;
    return (
      <div className="studio-main-background">
        <PageTitle title="Account settings" />
        <PageHeader title="Account Settings" />
        <Tabs
          defaultActiveKey={action || 'account-information'}
          style={{ padding: '0 24px' }}
          size="large"
          onChange={this.onTabsChange.bind(this)}
        >
          <Tabs.TabPane key="account-information" tab="Account Information">
            <StudioInformation
              {...studio}
              countries={countries}
              onFinish={this.onFinish.bind(this)}
              loading={updating}
            />
          </Tabs.TabPane>
          <Tabs.TabPane key="change-password" tab="Change Password">
            <PasswordChange
              onFinish={this.onPasswordChange.bind(this)}
              submiting={updating}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Admin commission" key="commission">
            <p style={{ textAlign: 'center' }}>Check your commissions below for different transactions after the admin’s cut.</p>
            <CommissionCard role={ROLE_STUDIO} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Payment Information" key="paymentInfo">
            <Collapse
              accordion
              onChange={this.onPaymentInformationChange.bind(this)}
            >
              <Panel header="Wire Transfer (Free)" key="wire" forceRender>
                <WireTransferSettingForm
                  paymentInformation={paymentInformation.wire}
                  loading={updating}
                  onFinish={this.submitPaymentInfoForm.bind(this)}
                  countries={countries}
                />
              </Panel>
              <Panel header="Paypal" key="paypal" forceRender>
                <PaypalSettingFrom
                  paymentInformation={paymentInformation.paypal}
                  loading={updating}
                  onFinish={this.submitPaymentInfoForm.bind(this)}
                />
              </Panel>
              <Panel
                header="Issue Check (U.S only)"
                key="issue_check_us"
                forceRender
              >
                <IssueCheckUSSetingForm
                  paymentInformation={paymentInformation.issue_check_us}
                  loading={updating}
                  onFinish={this.submitPaymentInfoForm.bind(this)}
                />
              </Panel>
              <Panel header="Direct Deposit" key="deposit" forceRender>
                <DirectDepositSettingForm
                  paymentInformation={paymentInformation.deposit}
                  loading={updating}
                  onFinish={this.submitPaymentInfoForm.bind(this)}
                />
              </Panel>
              <Panel header="Paxum" key={PAYMENT_ACCOUNT.PAXUM} forceRender>
                <PaxumSettingForm
                  paymentInformation={
                      paymentInformation[PAYMENT_ACCOUNT.PAXUM]
                    }
                  loading={updating}
                  onFinish={this.submitPaymentInfoForm.bind(this)}
                />
              </Panel>
              <Panel header="Bitpay" key={PAYMENT_ACCOUNT.BITPAY} forceRender>
                <BitpaySettigForm
                  paymentInformation={
                      paymentInformation[PAYMENT_ACCOUNT.BITPAY]
                    }
                  loading={updating}
                  onFinish={this.submitPaymentInfoForm.bind(this)}
                />
              </Panel>
            </Collapse>
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}
const mapStates = (state) => ({
  auth: state.auth,
  studio: state.studio.current,
  updating: state.studio.updatingStudio,
  success: state.studio.updateStudioSuccess,
  countries: state.settings.countries,
  errorInfo: state.studio.updateStudioError
});

const mapDispatch = {
  updateStudio,
  updateStudioPaymentInfo,
  updateStudioDirectDeposit,
  updateStudioPaxum,
  updateStudioBitpay,
  updatePassword
};

export default connect(mapStates, mapDispatch)(StudioProfilePage);
