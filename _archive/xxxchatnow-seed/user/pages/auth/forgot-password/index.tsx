import {
  Button, Form, Input, message, Select
} from 'antd';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';
import { IForgotPasswordFormData } from 'src/interfaces';
import { getResponseError } from 'src/lib/utils';
import { authService } from 'src/services/auth.service';

import style from './forgot-password.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel,
  placeholderLoginUrl: state.ui.placeholderLoginUrl
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function ForgotPasswordPage({
  singularTextModel = 'Performer'
}: PropsFromRedux) {
  const [loading, setLoading] = useState(false);
  const placeholderLoginUrl = useSelector((state: any) => state.ui.placeholderLoginUrl);

  const onFinish = async (data: IForgotPasswordFormData) => {
    try {
      setLoading(true);
      await authService.forgotPassword(data.email, data.type);
      message.success('New password have been sent to your email');
      setLoading(false);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
      setLoading(false);
    }
  };

  return (
    <div className={style['register-page']}>
      <PageTitle title="Forgot password" />
      <div className="form-register-container">
        <Form
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ type: 'user' }}
        >
          <h1>Forgot Password</h1>
          <Form.Item
            label="Type"
            name="type"
            key="type"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="user" key="user">
                User
              </Select.Option>
              <Select.Option value="performer" key="performer">
                {singularTextModel}
              </Select.Option>
              <Select.Option value="studio" key="studio">
                Studio
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="email"
            key="email"
            label="Email"
            rules={[
              { type: 'email', message: 'The input is not valid E-mail!' },
              { required: true, message: 'Please input your email!' }
            ]}
          >
            <Input type="email" placeholder="abc@example.com" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              disabled={loading}
              loading={loading}
              htmlType="submit"
            >
              Submit
            </Button>
          </Form.Item>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              margin: '15px 0'
            }}
          >
            <Link href="/auth/resend-verification-email">
              <a>Resend Email Verification</a>
            </Link>
            <Link href="/auth/login/user">
              <a>Login</a>
            </Link>
          </div>
        </Form>
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </div>
  );
}

ForgotPasswordPage.layout = 'auth';
ForgotPasswordPage.authenticate = false;

export default connector(ForgotPasswordPage);
