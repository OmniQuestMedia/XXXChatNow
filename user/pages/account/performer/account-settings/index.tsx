// import { TwoFactorAuthenticationForm } from '@components/auth/two-factor-authentication-form';
import { formItemLayout } from '@lib/layout';
import { getResponseError } from '@lib/utils';
import {
  Button, Collapse,
  Form, message, Tabs
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  ICountry,
  IPerformer,
  IUpdatePasswordFormData,
  PAYMENT_ACCOUNT
} from 'src/interfaces';
import { logout, updatePassword } from 'src/redux/auth/actions';
import {
  updateBitpay,
  updateDefaultPrice,
  updateDirectDeposit,
  updatePaxum,
  updatePaymentInfo,
  updatePerformerProfile
} from 'src/redux/performer/actions';
import { paymentInformationService, performerService } from 'src/services';
import { SocketContext } from 'src/socket';
import { ISocketContext } from 'src/socket/SocketContext';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const BitpaySettigForm = dynamic(() => import('@components/payment').then((res) => res.BitpaySettigForm), { ssr: false });
const DirectDepositSettingForm = dynamic(() => import('@components/payment/direct-deposit-form').then((res) => res.DirectDepositSettingForm), { ssr: false });
const IssueCheckUSSetingForm = dynamic(() => import('@components/payment/issue-check-us-setting-form').then((res) => res.IssueCheckUSSetingForm), { ssr: false });
const PaxumSettingForm = dynamic(() => import('@components/payment/paxum-form').then((res) => res.PaxumSettingForm), { ssr: false });
const PaypalSettingFrom = dynamic(() => import('@components/payment/paypal-setting-form').then((res) => res.PaypalSettingFrom), { ssr: false });
const WireTransferSettingForm = dynamic(() => import('@components/payment/wire-transfer-setting-form').then((res) => res.WireTransferSettingForm), { ssr: false });

const PasswordChange = dynamic(() => import('@components/auth/password-change'), { ssr: false });
const CommissionCard = dynamic(() => import('@components/commission/commission-card'), { ssr: false });
const Timezones = dynamic(() => import('@components/common/base/select/timezones'), { ssr: false });
const BroadcastSetting = dynamic(() => import('@components/performer/broadcast-setting-form'), { ssr: false });
const ContactSettingForm = dynamic(() => import('@components/performer/contact-setting-form'), { ssr: false });
const DocumentsSettingForm = dynamic(() => import('@components/performer/documents-setting-form'), { ssr: false });
const DefaultPriceForm = dynamic(() => import('@components/performer/settings/default-price-form'), { ssr: false });
const DisableAccountForm = dynamic(() => import('@components/performer/settings/disable-account-form'), { ssr: false });
const NotificationSettings = dynamic(() => import('@components/performer/settings/notification-settings'), { ssr: false });

const { Panel } = Collapse;

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
  action: string;
  auth: any;
  updatePerformerProfile: Function;
  updatePaymentInfo: Function;
  updateDirectDeposit: Function;
  updateBitpay: Function;
  updatePaxum: Function;
  updatePassword(data: IUpdatePasswordFormData): Function;
  updating: boolean;
  updateSuccess: boolean;
  updateError: any;
  updateDefaultPrice: Function;
  logout: Function;
}
interface IStates {
  updatingBroadcastSetting: boolean;
  paymentInformationKey: string;
  paymentInformation: Record<string, any>;
}

class UserProfilePage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static layout = 'primary';

  static getInitialProps(ctx) {
    const { query } = ctx;
    return {
      action: query.action
    };
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      updatingBroadcastSetting: false,
      paymentInformationKey: '',
      paymentInformation: {}
    };
  }

  componentDidUpdate(prevProps: IProps, prevStates: IStates) {
    const { updateSuccess, updateError, auth } = this.props;
    const { paymentInformationKey } = this.state;
    if (prevProps.updateSuccess !== updateSuccess && updateSuccess) {
      message.success('Update Profile Success.');
    }

    if (prevProps.updateError !== updateError && updateError) {
      message.error(getResponseError(updateError));
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

  onFinish(data: any) {
    const {
      performer,
      updatePerformerProfile: dispatchupdatePerformerProfile
    } = this.props;
    dispatchupdatePerformerProfile({ ...performer, ...data });
  }

  onTabsChange(key: string) {
    Router.push(
      {
        pathname: '/account/performer/account-settings',
        query: { action: key }
      },
      `/account/performer/account-settings?action=${key}`,
      { shallow: false, scroll: false }
    );
  }

  async onUpdateBroadcastSetting(data) {
    try {
      this.setState({ updatingBroadcastSetting: true });
      await performerService.updateBroadcastSetting(data);
      message.success('Update Broadcast Setting Success.');
    } catch (error) {
      const err = await Promise.resolve(error);
      message.error(getResponseError(err));
    } finally {
      this.setState({ updatingBroadcastSetting: false });
    }
  }

  onPasswordChange(data: IUpdatePasswordFormData) {
    const { updatePassword: dispatchUpdatePassword } = this.props;
    dispatchUpdatePassword({ ...data, source: 'performer' });
  }

  onUpdateDefaultPrice(data) {
    const { updateDefaultPrice: dispatchUpdateDefaultPrice } = this.props;
    dispatchUpdateDefaultPrice(data);
  }

  async onSuspendAccount(data) {
    try {
      const { logout: dispatchLogout } = this.props;
      const { password } = data;
      await performerService.suspendAccount(password);
      const { getSocket } = this.context as ISocketContext;
      const socket = getSocket();
      if (socket) {
        socket.disconnect();
      }
      dispatchLogout();
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
    return undefined;
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
      performer, action, auth, updating, countries
    } = this.props;
    const { paymentInformation, updatingBroadcastSetting } = this.state;
    return (
      <div className={style['account-setting-page']}>
        <PageTitle title="Account settings" />
        <PageHeader title="Account Settings" />
        <Tabs
          defaultActiveKey={action || 'commission'}
          style={{ padding: '0 24px' }}
          size="large"
          onChange={this.onTabsChange.bind(this)}
        >
          <Tabs.TabPane tab="Commission" key="commission">
            {
              performer.studioId
                ? (
                  <>
                    <p style={{ textAlign: 'center' }}>
                      check the commission set by studio owner
                    </p>
                    <p style={{ textAlign: 'center' }}>
                      final amount is based on post deductions of studio’s commissions set by site owner
                    </p>
                  </>
                )
                : (
                  <p style={{ textAlign: 'center' }}>
                    Check your commissions below for different transactions after the admin’s cut.
                  </p>
                )
            }
            <CommissionCard />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Default Price" key="default-price">
            <DefaultPriceForm
              {...performer}
              loading={updating}
              onFinish={this.onUpdateDefaultPrice.bind(this)}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Documents" key="documents">
            <DocumentsSettingForm
              loading={updating}
              onFinish={this.onFinish.bind(this)}
              performer={performer}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Contact Setting" key="contact-settings">
            <ContactSettingForm
              {...performer}
              onFinish={this.onFinish.bind(this)}
              loading={updating}
              countries={countries}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Broadcast Setting" key="broadcast-settings">
            <BroadcastSetting
              performer={performer}
              onFinish={this.onUpdateBroadcastSetting.bind(this)}
              loading={updatingBroadcastSetting}
            />
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
          <Tabs.TabPane key="timezone" tab="Timezone">
            <h3>
              Sometimes the timezone is very important so make sure you alway
              set up it correctly. We will contact you taking into
              consideration the time zone and so may the performer do!
            </h3>
            <Form
              onFinish={this.onFinish.bind(this)}
              layout="vertical"
              initialValues={{ timezone: performer.timezone }}
              {...formItemLayout}
            >
              <Form.Item
                name="timezone"
                key="timezone"
                label="Timezone"
                rules={[
                  {
                    required: true,
                    message: 'Please input your timezone!'
                  }
                ]}
              >
                <Timezones />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  disabled={updating}
                  loading={updating}
                  htmlType="submit"
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Disable Account" key="disable-account">
            <DisableAccountForm
              loading={updating}
              onFinish={this.onSuspendAccount.bind(this)}
            />
          </Tabs.TabPane>
          <Tabs.TabPane key="change-password" tab="Change Password">
            <PasswordChange
              onFinish={this.onPasswordChange.bind(this)}
              {...auth.updatePassword}
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="notification" tab="Notification">
            <NotificationSettings />
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  }
}

UserProfilePage.authenticate = true;
UserProfilePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  performer: state.performer.current,
  updating: state.performer.updating,
  updateSuccess: state.performer.updateSuccess,
  updateError: state.performer.updateError,
  countries: state.settings.countries,
  auth: state.auth
});

const mapDispatch = {
  updatePerformerProfile,
  logout,
  updatePaymentInfo,
  updatePassword,
  updateDirectDeposit,
  updateBitpay,
  updatePaxum,
  updateDefaultPrice
};

export default connect(mapStateToProps, mapDispatch)(UserProfilePage);
