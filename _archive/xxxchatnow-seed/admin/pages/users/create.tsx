import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { AccountForm } from '@components/user/account-form';
import { getResponseError, validateUsername } from '@lib/utils';
import { userService } from '@services/index';
import { utilsService } from '@services/utils.service';
import {
  message
} from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { ICountry } from 'src/interfaces';

interface IProps {
  countries: ICountry[];
}
class UserCreate extends PureComponent<IProps> {
  static async getInitialProps() {
    const resp = await utilsService.countriesList();
    return {
      countries: resp.data
    };
  }

  state = {
    creating: false
  };

  _avatar: File;

  onBeforeUpload(file) {
    this._avatar = file;
  }

  async submit(data: any) {
    try {
      if (data.password !== data.rePassword) {
        message.error('Confirm password mismatch!');
        return;
      }

      if (!validateUsername(data.username)) {
        message.error('Username is invalid!');
        return;
      }

      this.setState({ creating: true });
      const resp = await userService.create(data);
      message.success('Updated successfully');
      if (this._avatar) {
        await userService.uploadAvatarUser(this._avatar, resp.data._id);
      }
      Router.push(`/users/update?id=${resp.data._id}`);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(
        getResponseError(err) || 'An error occurred, please try again!'
      );
    } finally {
      this.setState({ creating: false });
    }
  }

  render() {
    const { creating } = this.state;
    const { countries } = this.props;
    return (
      <>
        <Head>
          <title>Create user</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Users', href: '/user' },
            { title: 'Create new user' }
          ]}
        />
        <Page>
          <AccountForm
            onFinish={this.submit.bind(this)}
            updating={creating}
            options={{
              beforeUpload: this.onBeforeUpload.bind(this)
            }}
            countries={countries}
          />
        </Page>
      </>
    );
  }
}

export default UserCreate;
