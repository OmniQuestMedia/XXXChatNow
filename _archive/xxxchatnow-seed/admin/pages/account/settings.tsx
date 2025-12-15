import Page from '@components/common/layout/page';
import { UpdateAdminAccountPasswordForm } from '@components/setting/update-admin-account-password-form';
import { AccountForm } from '@components/user/account-form';
import GoogleFormAuthentication from '@components/user/googlle2fa/google-authenticator';
import { authService, userService } from '@services/index';
import { utilsService } from '@services/utils.service';
import { message, Tabs } from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { ICountry, IUser } from 'src/interfaces';
import { updateCurrentUserAvatar, updateUser } from 'src/redux/user/actions';

interface IProps {
  currentUser: IUser;
  updateUser: Function;
  updating?: boolean;
  updateCurrentUserAvatar: Function;
  countries: ICountry[];
  updateSuccess?: boolean;
}
class AccountSettings extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    const resp = await utilsService.countriesList();
    return {
      countries: resp.data,
      ...ctx.query
    };
  }

  state = {
    pwUpdating: false
  };

  componentDidUpdate(prevProps: any) {
    if (
      prevProps.updateSuccess !== this.props.updateSuccess
      && this.props.updateSuccess
    ) {
      message.success('Updated successfully!');
    }
  }

  onAvatarUploaded(data: any) {
    message.success('Avatar has been updated!');
    this.props.updateCurrentUserAvatar(data.base64);
  }

  submit(data: any) {
    this.props.updateUser(data);
    // TODO - show alert success for update?
    // or move to sagas
  }

  async updatePassword(data: any) {
    try {
      this.setState({ pwUpdating: true });
      await authService.updateAdminPassword(data);
      message.success('Password has been updated!');
    } catch (e) {
      message.error('An error occurred, please try again!');
    } finally {
      this.setState({ pwUpdating: false });
    }
  }

  render() {
    const { currentUser, updating, countries } = this.props;
    const { pwUpdating } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <>
        <Head>
          <title>Account Settings</title>
        </Head>
        <Page>
          <Tabs defaultActiveKey="basic" tabPosition="left">
            <Tabs.TabPane tab={<span>Basic info</span>} key="basic">
              <AccountForm
                onFinish={this.submit.bind(this)}
                user={currentUser}
                updating={updating}
                options={{
                  uploadHeaders,
                  avatarUploadUrl: userService.getAvatarUploadUrl(),
                  onAvatarUploaded: this.onAvatarUploaded.bind(this)
                }}
                countries={countries}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Change password</span>} key="password">
              <UpdateAdminAccountPasswordForm
                onFinish={this.updatePassword.bind(this)}
                updating={pwUpdating}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Manage 2FA</span>} key="Manage-2FA">
              <GoogleFormAuthentication user={currentUser} />
            </Tabs.TabPane>
          </Tabs>
        </Page>
      </>
    );
  }
}

const mapStates = (state: any) => ({
  currentUser: state.user.current,
  updating: state.user.updating,
  updateSuccess: state.user.updateSuccess
});
const mapDispatch = { updateUser, updateCurrentUserAvatar };
export default connect(mapStates, mapDispatch)(AccountSettings);
