import {
  Alert,
  Button, Form, Input, message, Select
} from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { getResponseError, validateMessages } from 'src/lib';
import { authService, settingService } from 'src/services';

import style from './resend-verification.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));
const Page = dynamic(() => import('@components/common/layout/page'));

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function ResendVerificationEmail({ singularTextModel = 'Performer' }: PropsFromRedux) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState({
    hasError: false,
    msg: ''
  });
  const [setting, setSetting] = useState<Record<string, any>>({});
  const [time, setTime] = useState(60);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const startCountdown = () => {
    const countdownInterval = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime === 0) {
          clearInterval(countdownInterval);
          localStorage.removeItem('countdownStartTime'); // Clear the start time from localStorage
          setIsButtonDisabled(false);
          return 60;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const getSettingKeys = async () => {
    const metaSettings = await settingService.valueByKeys([
      'placeholderLoginUrl'
    ]);
    setSetting(metaSettings.data);
  };
  const submit = async (data) => {
    try {
      setError({
        hasError: false,
        msg: ''
      });
      setSubmitting(true);
      await authService.resendVerificationEmail(data);
      message.success(
        'Verification email have been sent. Please check your inbox or spam box!'
      );
      setSubmitting(false);
      setIsButtonDisabled(true);
      localStorage.setItem('countdownStartTime', Date.now().toString()); // Store the countdown start time
      startCountdown();
    } catch (e) {
      const err = await Promise.resolve(e);
      setError({
        hasError: true,
        msg: getResponseError(err)
      });
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getSettingKeys();
  }, []);

  useEffect(() => {
    // Retrieve the countdown start time from localStorage
    const startTime = Number(localStorage.getItem('countdownStartTime'));
    if (startTime) {
      const remainingTime = 60 - ((Date.now() - startTime) / 1000);
      if (remainingTime > 0) {
        setTime(Math.ceil(remainingTime));
        setIsButtonDisabled(true);
        startCountdown();
      }
    }
  }, []);

  return (
    <Page className={`${style['register-page']} resend-verification-email-page`} inner>
      <PageTitle title="Resend Verification Email" />
      <div className="form-register-container">
        <Form
          onFinish={submit}
          layout="vertical"
          validateMessages={validateMessages}
        >
          <h1>Resend Verification Email</h1>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'The input is not valid E-mail!' }
            ]}
          >
            <Input type="email" placeholder="E-mail" />
          </Form.Item>
          <Form.Item
            name="source"
            rules={[{ required: true }]}
          >
            <Select placeholder="You are?">
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="performer">{singularTextModel}</Select.Option>
              <Select.Option value="studio">Studio</Select.Option>
            </Select>
          </Form.Item>
          {error.hasError && (
            <Form.Item>
              <Alert
                showIcon
                type="error"
                description={error.msg}
                message="Error"
              />
            </Form.Item>
          )}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting || isButtonDisabled}
              disabled={submitting || isButtonDisabled}
            >
              {isButtonDisabled ? 'Resend in' : 'Send'}
              {' '}
              {isButtonDisabled && `${time}s`}
            </Button>
          </Form.Item>
        </Form>
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={setting.placeholderLoginUrl} />
    </Page>
  );
}

ResendVerificationEmail.layout = 'auth';

export default ResendVerificationEmail;
