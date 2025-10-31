import { CopyrightCircleOutlined } from '@ant-design/icons';
import { authService } from '@services/auth.service';
import {
  Button, Form, Input, message, Row
} from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import style from './index.module.less';

const FormItem = Form.Item;

const mapStates = (state) => ({
  logo: state.ui.logo,
  siteName: state.ui.siteName
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function Forgot({
  siteName,
  logo
}: PropsFromRedux) {
  const [loading, setLoading] = useState(false);

  const handleOk = async (data) => {
    try {
      setLoading(true);
      await authService.forgotPassword(data.email, 'user');
      message.success('New password have been sent to your email');
      setLoading(false);
    } catch (e) {
      message.error('Cannot send password reset email, please recheck later');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot password</title>
      </Head>
      <div className={style.form} style={{ height: '240px' }}>
        <div className={style.logo}>
          {logo && <img alt="logo" src={logo} />}
          <span>{siteName}</span>
        </div>
        <Form
          onFinish={handleOk}
        >
          <FormItem
            hasFeedback
            // label="Username"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email' }
            ]}
          >
            <Input
              placeholder="youremail@example.com"
            />
          </FormItem>
          <Row>
            <Button
              type="primary"
              loading={loading}
              htmlType="submit"
            >
              Submit
            </Button>
          </Row>
        </Form>
        <p>
          <Link href="/auth/login">
            <a style={{ float: 'right' }}>Login</a>
          </Link>
        </p>
      </div>
      <div className={style.footer}>
        {siteName}
        {' '}
        <CopyrightCircleOutlined />
        {' '}
        {`Copyright ${new Date().getFullYear()}`}
      </div>
    </>
  );
}

Forgot.authenticate = false;
Forgot.layout = 'public';

export default connector(Forgot);
