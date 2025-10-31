import { UploadOutlined } from '@ant-design/icons';
import { usernamePatternRule } from '@lib/rules';
import { getResponseError } from '@lib/utils';
import { authService, utilsService } from '@services/index';
import {
  Alert, Button, Checkbox, DatePicker, Form, Input, message,
  Select, Upload
} from 'antd';
import moment from 'moment';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { createRef, useEffect, useState } from 'react';
import { ReCAPTCHA } from 'react-google-recaptcha';
import { connect, ConnectedProps } from 'react-redux';
import Recaptcha from 'src/components/common/recaptcha';

type IProps = {
  googleReCaptchaEnabled?: boolean;
  googleReCaptchaSiteKey?: string;
  linkToAgreementContent?: string;
  singularTextModel: string;
  rel: string;
};

const mapStates = (state: any) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function ModelRegisterForm({
  googleReCaptchaEnabled = false,
  googleReCaptchaSiteKey = '',
  linkToAgreementContent = '',

  // Get from redux
  singularTextModel = 'performer',
  rel
}: IProps & PropsFromRedux) {
  const reCAPTCHARef = createRef<ReCAPTCHA>();
  const [reCAPTCHAError, setreCAPTCHAError] = useState('');
  const [idVerification, setIdVerification] = React.useState('');
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

      if (!data.agreeTermOfUse) {
        message.error('Should accept and agree to the Terms of Use & Privacy Policy');
        return;
      }

      if (!data.agreeProviderAgreement) {
        message.error('Should accept and agree to the Provider Agreement');
        return;
      }

      setSubmitting(true);
      const resp = await authService.performersRegister({
        ...data,
        dateOfBirth: moment(data.dateOfBirth).toDate(),
        recaptchaValue,
        rel
      });
      message.success(resp.data?.message || 'Registered successfully, please wait for our admin approval');
      setSubmitting(false);
      router.push('/auth/login/performer');
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
      name="performerRegisterForm"
      initialValues={{ country: undefined, gender: 'female' }}
    >
      <h1 style={{ color: 'var(--black)' }}>
        {singularTextModel || 'Performer'}
        {' '}
        register
      </h1>
      <Form.Item
        name="firstName"
        rules={[
          {
            required: true,
            message: 'Please input your first name!'
          },
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
            required: true,
            message: 'Please input your last name!'
          },
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
        name="dateOfBirth"
        rules={[
          {
            required: true,
            message: 'Please input your date of birth!'
          }
        ]}
      >
        <DatePicker
          placeholder="Date of Birth"
          disabledDate={(currentDate) => currentDate && currentDate > moment().subtract(18, 'year').endOf('day')}
          defaultValue={moment().subtract(18, 'years').startOf('day')}
        />
      </Form.Item>
      <Form.Item name="gender">
        <Select placeholder="Gender">
          <Select.Option value="male" key="male">
            Male
          </Select.Option>
          <Select.Option value="female" key="female">
            Female
          </Select.Option>
          <Select.Option value="transgender" key="transgender">
            Transgender
          </Select.Option>
        </Select>
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
        name="username"
        rules={[
          {
            required: true,
            message: 'Username is required!'
          },
          usernamePatternRule
        ]}
      >
        <Input placeholder="Username" />
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
      <Form.Item
        name="idVerification"
        rules={[
          {
            required: true,
            message: 'ID Verification is required'
          }
        ]}
      >
        <Upload
          showUploadList={false}
          customRequest={() => true}
          fileList={[]}
          onChange={(files) => setIdVerification(files.file.name)}
        >
          <Button>
            <UploadOutlined />
            Upload ID For Verification
          </Button>
          {idVerification && (
            <span className="file-name">{idVerification}</span>
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
      {googleReCaptchaEnabled
        && (
          <Form.Item>
            <Recaptcha
              ref={reCAPTCHARef}
              googleReCaptchaEnabled={googleReCaptchaEnabled}
              googleReCaptchaSiteKey={googleReCaptchaSiteKey}
              error={reCAPTCHAError}
            />
          </Form.Item>
        )}
      <Form.Item
        name="agreeTermOfUse"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) => (value
              ? Promise.resolve()
              : Promise.reject(
                new Error(
                  'Should accept and agree to the Terms of Use'
                )
              ))
          }
        ]}
      >
        <Checkbox>
          I have reviewed and agree to the
          {' '}
          <Link href="/page/terms-of-use" as="/terms-of-use">
            <a target="_blank">Terms of Use</a>
          </Link>
        </Checkbox>
      </Form.Item>
      <Form.Item
        name="agreePrivacyPolicy"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) => (value
              ? Promise.resolve()
              : Promise.reject(
                new Error(
                  'Should accept and agree to the Terms of Use'
                )
              ))
          }
        ]}
      >
        <Checkbox>
          I have reviewed and agree to the
          {' '}
          <Link href="/page/privacy-policy" as="/privacy-policy">
            <a target="_blank">Privacy Policy</a>
          </Link>
        </Checkbox>
      </Form.Item>
      <Form.Item
        name="agreeProviderAgreement"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) => (value
              ? Promise.resolve()
              : Promise.reject(
                new Error('Please accept our content provider agreement document')
              ))
          }
        ]}
        help={<span className="notes">This agreement is governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. The parties attorn to the exclusive jurisdiction of the courts of Ontario, located in Toronto, Ontario.</span>}
      >
        <Checkbox>
          Please accept our
          {' '}
          <a target="_blank" href={`/page/${linkToAgreementContent}`} rel="noreferrer">Content Provider Agreement Document</a>
        </Checkbox>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          disabled={submitting}
          loading={submitting}
          className="btn-submit"
        >
          Register new account
        </Button>
      </Form.Item>
      <Form.Item>
        Are you a
        {' '}
        {singularTextModel}
        ?
        {' '}
        <Link href="/auth/login/performer">
          <a>Login</a>
        </Link>
      </Form.Item>
      <Form.Item>
        Want to be a member?
        {' '}
        <Link href={{ pathname: '/auth/register/user', query: { rel } }} as="/signup/member">
          <a>Signup now</a>
        </Link>
      </Form.Item>
    </Form>
  );
}

export default connector(ModelRegisterForm);
