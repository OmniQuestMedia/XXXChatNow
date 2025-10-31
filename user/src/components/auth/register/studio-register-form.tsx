import { UploadOutlined } from '@ant-design/icons';
import { getResponseError } from '@lib/utils';
import { authService, utilsService } from '@services/index';
import {
  Alert, Button, Form, Input, message,
  Select, Upload
} from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { createRef, useEffect, useState } from 'react';
import { ReCAPTCHA } from 'react-google-recaptcha';
import { connect, ConnectedProps } from 'react-redux';
import Recaptcha from 'src/components/common/recaptcha';

type IProps = {
  googleReCaptchaEnabled?: boolean;
  googleReCaptchaSiteKey?: string;
  singularTextModel: string;
};

const mapStates = (state: any) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function StudioRegisterForm({
  singularTextModel = 'performer',
  googleReCaptchaEnabled = false,
  googleReCaptchaSiteKey = ''
}: IProps & PropsFromRedux) {
  const reCAPTCHARef = createRef<ReCAPTCHA>();
  const [reCAPTCHAError, setreCAPTCHAError] = useState('');
  const [documentVerification, setDocumentVerification] = React.useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCoutries] = useState([]);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();
  const router = useRouter();

  const loadCountries = async () => {
    const resp = await utilsService.countriesList();
    setCoutries(resp.data);
  };

  const onFinish = async (data) => {
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

      setSubmitting(true);
      const resp = await authService.studioRegister({
        ...data,
        recaptchaValue
      });
      message.success(resp.data?.message || 'Registered successfully, please wait for our admin approval');
      setSubmitting(false);
      router.push('/studio/login');
    } catch (e) {
      if (googleReCaptchaEnabled) {
        reCAPTCHARef.current.reset();
      }
      const err = await Promise.resolve(e);
      setError(getResponseError(err));
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={onFinish}
      name="studioRegisterForm"
      initialValues={{
        country: undefined,
        gender: 'male'
      }}
    >
      <h1 style={{ color: 'var(--black)' }}>Studio register</h1>
      <Form.Item
        name="firstName"
        rules={[
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Alphanumeric'
          },
          {
            whitespace: true,
            message: 'Please input your first name!'
          }
        ]}
      >
        <Input placeholder="First Name" />
      </Form.Item>
      <Form.Item
        name="lastName"
        rules={[
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Alphanumeric'
          },
          {
            whitespace: true,
            message: 'Please input your last name!'
          }
        ]}
      >
        <Input placeholder="Last Name" />
      </Form.Item>
      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: 'Please input your studio name!'
          },
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Alphanumeric'
          },
          {
            whitespace: true,
            message: 'Please input your studio name!'
          }
        ]}
      >
        <Input placeholder="Studio Name" />
      </Form.Item>
      <Form.Item
        name="username"
        rules={[
          {
            required: true,
            message: 'Username is required!'
          },
          {
            pattern: /^[a-zA-Z0-9]*$/,
            message: 'Dont allow special chars or space'
          }
        ]}
      >
        <Input placeholder="Username" />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          {
            type: 'email',
            message: 'The input is not valid E-mail!'
          },
          {
            required: true,
            message: 'Please input your E-mail!'
          }
        ]}
      >
        <Input placeholder="E-mail" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password!'
          },
          {
            min: 6,
            max: 14,
            message: 'Passoword should be 6-14 characters'
          }
        ]}
        hasFeedback
      >
        <Input.Password placeholder="Password" />
      </Form.Item>
      <Form.Item
        name="confirm"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password!'
          },
          ({ getFieldValue }) => ({
            validator(rule, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error('The two passwords that you entered do not match!')
              );
            }
          })
        ]}
      >
        <Input.Password placeholder="Confirm Password" />
      </Form.Item>
      <Form.Item
        name="country"
        rules={[{ required: true, message: 'Please input your country!' }]}
      >
        <Select showSearch placeholder="Country">
          {countries.map((country) => (
            <Select.Option value={country.name} key={country.code}>
              {country.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        name="documentVerification"
        rules={[
          {
            required: true,
            message: 'Verification document is required!'
          }
        ]}
      >
        <Upload
          showUploadList={false}
          customRequest={() => true}
          fileList={[]}
          onChange={(files) => setDocumentVerification(files.file.name)}
        >
          <Button>
            <UploadOutlined />
            {' '}
            Upload Document For Verification
          </Button>
          {documentVerification && (
            <span className="file-name">{documentVerification}</span>
          )}
        </Upload>
      </Form.Item>
      {error && (
        <Form.Item>
          <Alert
            description={getResponseError(error)}
            type="error"
            message="Error"
          />
        </Form.Item>
      )}
      <Form.Item>
        <Recaptcha
          ref={reCAPTCHARef}
          googleReCaptchaEnabled={googleReCaptchaEnabled}
          googleReCaptchaSiteKey={googleReCaptchaSiteKey}
          error={reCAPTCHAError}
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={submitting}
          disabled={submitting}
          className="btn-submit"
        >
          Register new account
        </Button>
      </Form.Item>
      <Form.Item>
        Want to be a Member?
        {' '}
        <Link href="/auth/register/user" as="/signup/member">
          <a>Signup here</a>
        </Link>
      </Form.Item>
      <Form.Item>
        Are you a
        {' '}
        {singularTextModel || 'Performer'}
        ?
        {' '}
        <Link href="/auth/login/performer">
          <a>Login here</a>
        </Link>
      </Form.Item>
      <Form.Item>
        Are you a studio?
        {' '}
        <Link href="/studio/login">
          <a>Login here</a>
        </Link>
      </Form.Item>
    </Form>
  );
}

export default connector(StudioRegisterForm);
