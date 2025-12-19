import { CopyrightCircleOutlined } from '@ant-design/icons';
import { getResponseError } from '@lib/utils';
import { login } from '@redux/auth/actions';
import {
  Alert, Button, Form, Input
} from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { connect, ConnectedProps } from 'react-redux';

import style from './index.module.less';

const FormItem = Form.Item;

const mapStates = (state) => ({
  logo: state.ui.logo,
  siteName: state.ui.siteName,
  loginAuth: state.auth.login
});

const mapDispatch = { dispatchLogin: login };

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function Login({
  logo,
  siteName,
  loginAuth = { requesting: false, error: null, success: false },
  dispatchLogin
}: PropsFromRedux) {
  const handleOk = (data) => {
    dispatchLogin(data);
  };

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className={style.form}>
        <div className={style.logo}>
          {logo && <img alt="logo" src={logo} />}
          <span>{siteName}</span>
        </div>
        {loginAuth.error && (
        <Alert
          message="Error"
          description={getResponseError(loginAuth.error)}
          type="error"
          showIcon
        />
        )}
        {loginAuth.success ? (
          <Alert
            message="Login success"
            type="success"
            description="Redirecting..."
          />
        ) : (
          <Form
            onFinish={handleOk}
            initialValues={{
              email: '',
              password: ''
            }}
          >
            <FormItem
              hasFeedback
              name="username"
              rules={[
                { required: true, message: 'Please input your username or email!' }
              ]}
            >
              <Input placeholder="username or email" />
            </FormItem>
            <FormItem
              hasFeedback
              name="password"
              rules={[
                { required: true, message: 'Please input your password!' }
              ]}
            >
              <Input type="password" placeholder="Password" />
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                disabled={loginAuth.requesting}
                loading={loginAuth.requesting}
                htmlType="submit"
              >
                Sign in
              </Button>
            </FormItem>
          </Form>
        )}

        <p>
          <Link href="/auth/forgot">
            <a style={{ float: 'right' }}>Forgot password?</a>
          </Link>
        </p>
      </div>
      <div className={style.footer}>
        {siteName}
        {' '}
        <CopyrightCircleOutlined />
        {`Copyright ${new Date().getFullYear()}`}
      </div>
    </>
  );
}

Login.layout = 'public';
Login.authenticate = false;

export default connector(Login);
