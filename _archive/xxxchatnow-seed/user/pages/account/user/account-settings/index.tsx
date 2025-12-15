// import { TwoFactorAuthenticationForm } from '@components/auth/two-factor-authentication-form';
import { getResponseError } from '@lib/utils';
import { utilsService } from '@services/utils.service';
import {
  message, Tabs
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  ICountry,
  IUpdatePasswordFormData,
  IUser,
  IUserUpdateFormData
} from 'src/interfaces';
import { logout, updatePassword } from 'src/redux/auth/actions';
import { updateUser } from 'src/redux/user/actions';
import { userService } from 'src/services/user.service';
import { SocketContext } from 'src/socket';
import { ISocketContext } from 'src/socket/SocketContext';

import style from './index.module.less';

const PasswordChange = dynamic(() => import('@components/auth/password-change'), { ssr: false });
const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const DisableAccountForm = dynamic(() => import('@components/performer/settings/disable-account-form'), { ssr: false });
const UserProfile = dynamic(() => import('@components/user/profile'), { ssr: false });
const NotificationSettings = dynamic(() => import('@components/performer/settings/notification-settings'), { ssr: false });

interface IProps {
  user: IUser;
  action: string;
  auth: any;
  updateUser(data: IUserUpdateFormData): Function;
  updatePassword(data: IUpdatePasswordFormData): Function;
  userUpdating: boolean;
  success: boolean;
  updateUserError: any;
  logout: Function;
}

interface IStates {
  countries: ICountry[];
  avatarUploading: boolean;
  uploadedAvatar: string;
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
      countries: [],
      uploadedAvatar: '',
      avatarUploading: false
    };
  }

  componentDidMount() {
    const { action } = this.props;
    if (!action || action === 'account-information') this.getCountries();
  }

  componentDidUpdate(prevProps: IProps) {
    const {
      success, updateUserError, auth, action
    } = this.props;
    const { countries } = this.state;
    if (prevProps.success !== success && success) {
      message.success('Update Profile Success.');
    }

    if (prevProps.updateUserError !== updateUserError && updateUserError) {
      message.error(getResponseError(updateUserError));
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

    if (!countries.length && action === 'account-information') {
      this.getCountries();
    }
  }

  onFinish(data: any) {
    const { user, updateUser: dispatchUpdateUser } = this.props;
    dispatchUpdateUser({ ...user, ...data });
  }

  onChangeAvatar({ file }) {
    if (file.status === 'uploading') {
      this.setState({ avatarUploading: true });
      return;
    }

    if (file.status === 'done') {
      this.setState({ avatarUploading: false });
      if (file.response) {
        this.setState({
          uploadedAvatar: file.response.data.url
        });
      }
    }
  }

  onTabsChange(key: string) {
    Router.push(
      { pathname: '/account/user/account-settings', query: { action: key } },
      `/account/user/account-settings?action=${key}`,
      { shallow: false, scroll: false }
    );
  }

  onPasswordChange(data: IUpdatePasswordFormData) {
    const { updatePassword: dispatchUpdatePassword } = this.props;
    dispatchUpdatePassword(data);
  }

  async onSuspendAccount(data) {
    try {
      const { logout: dispatchLogout } = this.props;
      const { password } = data;
      await userService.suspendAccount(password);
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

  async getCountries() {
    try {
      const countries = await utilsService.countriesList();
      this.setState({ countries: countries.data });
    } catch (error) {
      message.error(getResponseError(error));
    }
  }

  render() {
    const {
      user, action, auth, userUpdating
    } = this.props;
    const { countries, uploadedAvatar, avatarUploading } = this.state;

    return (
      <div className={style['account-setting-page']}>
        <PageTitle title="Account settings" />
        <PageHeader title="Account Settings" />
        <Tabs
          activeKey={action || 'account-information'}
          style={{ padding: '0 24px' }}
          size="large"
          onChange={this.onTabsChange.bind(this)}
        >
          <Tabs.TabPane tab="Account Information" key="account-information">
            <UserProfile
              {...user}
              onFinish={this.onFinish.bind(this)}
              countries={countries}
              onChangeAvatar={this.onChangeAvatar.bind(this)}
              uploadAvatarUrl={userService.getAvatarUploadUrl()}
              uploadedAvatar={uploadedAvatar}
              avatarUploading={avatarUploading}
              loading={userUpdating}
            />
          </Tabs.TabPane>
          {/* <Tabs.TabPane key="timezone" tab="Timezone">
              <h3>
                Sometimes the timezone is very important so make sure you alway
                set up it correctly. We will contact you taking into
                consideration the time zone and so may the performer do!
              </h3>
              <Form
                onFinish={this.onFinish.bind(this)}
                layout="vertical"
                initialValues={{ timezone: user.timezone }}
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
                  <Timezones autoFocus />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane> */}
          <Tabs.TabPane key="change-password" tab="Change Password">
            <PasswordChange
              onFinish={this.onPasswordChange.bind(this)}
              {...auth.updatePassword}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Disable Account" key="disable-account">
            <DisableAccountForm
              loading={userUpdating}
              onFinish={this.onSuspendAccount.bind(this)}
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

UserProfilePage.contextType = SocketContext;

const mapStateToProps = (state) => ({
  user: state.user.current,
  userUpdating: state.user.userUpdating,
  success: state.user.updateUserSuccess,
  updateUserError: state.user.updateUserError,
  auth: state.auth
});
const mapDispatch = { updateUser, updatePassword, logout };
export default connect(mapStateToProps, mapDispatch)(UserProfilePage);
