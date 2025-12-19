import { loginSuccess } from '@redux/auth/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { authService } from '@services/auth.service';
import { userService } from '@services/user.service';
import {
  Button, Form,
  Input, Layout, message
} from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { put } from 'redux-saga/effects';

import style from './index.module.less';

const FormItem = Form.Item;

interface IProps {
  ui: any;
}

class Verify2FA extends PureComponent<IProps> {
  static layout: string = 'public';

  static authenticate: boolean = false;

  state = {
    loading: false
  };

  handleFinish = async (data) => {
    const dataItemLocal = localStorage.getItem('verify2FA');
    const dataItemUse = JSON.parse(dataItemLocal);
    try {
      this.setState({ loading: true });
      const token = await authService.verify2FA({
        id: dataItemUse?.id.toString(),
        twoFactorAuthenticationCode: data.twoFactorAuthenticationCode,
        remember: dataItemUse?.remember
      });
      message.success('Verified successfully');
      await authService.setToken(token.data?.token);
      this.setState({ loading: false });
      const userResp = (await userService.me()).data;
      await put(updateCurrentUser(userResp));
      await put(loginSuccess());
      Router.push('/');
    } catch (error) {
      this.setState({ loading: false });
      const e = await error;
      message.error(e.message || 'An error occurred');
    }
  };

  render() {
    const { ui } = this.props;
    const { loading } = this.state;
    return (
      <Layout>
        <Head>
          <title>Verify 2FA</title>
        </Head>
        <div className={style['form-verify']}>
          <div className={style.logo}>
            {ui.logo ? <div><img alt="logo" src={ui && ui.logo} /></div> : ui.siteName}
            <h2>Admin Panel</h2>
          </div>
          <Form
            onFinish={this.handleFinish}
            initialValues={{
              twoFactorAuthenticationCode: ''
            }}
          >
            <FormItem
              hasFeedback
              name="twoFactorAuthenticationCode"
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ required: true, message: 'Please input your otp!' }]}
            >
              <Input
                placeholder="Enter your otp"
              />
            </FormItem>
            <Button type="primary" loading={loading} htmlType="submit">
              Verify
            </Button>
          </Form>
        </div>
        <div className={style.footer} style={{ padding: '15px' }}>
          Copyright
          {' '}
          {new Date().getFullYear()}
        </div>
      </Layout>
    );
  }
}
const mapStates = (state: any) => ({
  ui: state.ui
});
const mapDispatch = {};
export default connect(mapStates, mapDispatch)(Verify2FA);
