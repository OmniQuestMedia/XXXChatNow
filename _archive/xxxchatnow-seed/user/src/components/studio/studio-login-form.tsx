import FormFooterLogin from '@components/auth/login/footer-login-form';
import { getResponseError } from '@lib/utils';
import { resetLoginData, studioLogin } from '@redux/auth/actions';
import {
  Alert, Button, Checkbox, Form, Input, message,
  Space
} from 'antd';
import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import { ReCAPTCHA } from 'react-google-recaptcha';
import { connect, ConnectedProps } from 'react-redux';
import Recaptcha from 'src/components/common/recaptcha';
import { ILogin } from 'src/interfaces';

const FormItem = Form.Item;

type IProps = {
  googleReCaptchaEnabled?: boolean;
  googleReCaptchaSiteKey?: string;
};

const mapStates = (state: any) => ({
  singularTextModel: state.ui.singularTextModel,
  userLogin: state.auth.userLogin
});

const mapDispatch = {
  dispatchLogin: studioLogin,
  resetLogin: resetLoginData
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function StudioFormLogin({
  userLogin,
  dispatchLogin,
  resetLogin,
  singularTextModel = 'Performer',
  googleReCaptchaEnabled = false,
  googleReCaptchaSiteKey = ''
}: IProps & PropsFromRedux) {
  const reCAPTCHARef = React.createRef<ReCAPTCHA>();
  const [reCAPTCHAError, setreCAPTCHAError] = React.useState('');
  const remember = useRef<boolean>(false);
  const [form] = Form.useForm();
  const onPressEnter = () => {
    form.submit();
  };
  const onFinish = async (data: ILogin) => {
    try {
      let recaptchaValue = null;
      if (googleReCaptchaEnabled) {
        recaptchaValue = reCAPTCHARef.current.getValue();
        if (!recaptchaValue) {
          setreCAPTCHAError('Please verify that you are not a robot.');
          return;
        }

        reCAPTCHARef.current.reset();
        setreCAPTCHAError('');
      }

      dispatchLogin({
        ...data,
        remember: remember.current,
        recaptchaValue
      });
    } catch (e) {
      if (googleReCaptchaEnabled) {
        reCAPTCHARef.current.reset();
      }
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  const {
    requesting,
    error,
    success
  } = userLogin;

  useEffect(() => () => {
    resetLogin();
  }, []);

  useEffect(() => {
    if (error && googleReCaptchaEnabled) {
      reCAPTCHARef.current.reset();
    }
  }, [error]);

  return (
    <Form layout="vertical" onFinish={onFinish}>
      <h1>Studio Sign-in</h1>
      <FormItem
        hasFeedback
        label="Username or Email"
        name="username"
        rules={[
          { required: true, message: 'Please input your username or email!' }
        ]}
      >
        <Input
          onPressEnter={onPressEnter}
          placeholder="username or email"
        />
      </FormItem>
      <FormItem
        hasFeedback
        label={(
          <Space>
            <span>Password</span>
          </Space>
        )}
        className="input-password"
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          {
            min: 6,
            max: 14,
            message: '6-14 characters'
          }
        ]}
      >
        <Input.Password
          onPressEnter={onPressEnter}
          placeholder="Password"
        />
      </FormItem>
      {googleReCaptchaEnabled
      && (
      <FormItem>
        <Recaptcha
          ref={reCAPTCHARef}
          googleReCaptchaEnabled={googleReCaptchaEnabled}
          googleReCaptchaSiteKey={googleReCaptchaSiteKey}
          error={reCAPTCHAError}
        />
      </FormItem>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          margin: '15px 0'
        }}
      >
        <Checkbox onChange={(e) => {
          remember.current = e.target.checked;
        }}
        >
          Remember me
        </Checkbox>
        <Link href="/auth/forgot-password">
          <a>Forgot password?</a>
        </Link>
      </div>
      {(error || success) && (
        <FormItem>
          {error && (
            <Alert
              message="Error"
              description={getResponseError(error)}
              type="error"
              showIcon
            />
          )}
          {success && (
            <Alert
              message="Login success"
              type="success"
              description="Redirecting..."
            />
          )}
        </FormItem>
      )}
      <FormItem className="row-button-auth">
        <Button
          type="primary"
          htmlType="submit"
          disabled={requesting}
          loading={requesting}
        >
          Sign-in
        </Button>
      </FormItem>
      <FormFooterLogin account="studio" singularTextModel={singularTextModel} />
    </Form>
  );
}

export default connector(StudioFormLogin);
