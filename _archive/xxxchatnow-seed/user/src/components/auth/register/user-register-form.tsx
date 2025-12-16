import { getResponseError } from '@lib/utils';
import { authService, utilsService } from '@services/index';
import {
  Alert, Button, Checkbox, DatePicker, Form, Input, message,
  Select
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
  singularTextModel: string;
  rel: string;
};

const mapStates = (state: any) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function UserRegisterFrom({
  singularTextModel,
  googleReCaptchaEnabled = false,
  googleReCaptchaSiteKey = '',
  rel
}: IProps & PropsFromRedux) {
  const reCAPTCHARef = createRef<ReCAPTCHA>();
  const [reCAPTCHAError, setreCAPTCHAError] = useState('');
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

      setSubmitting(true);
      const resp = await authService.userRegister({
        ...data,
        dateOfBirth: moment(data.dateOfBirth).toDate(),
        recaptchaValue,
        rel
      });
      message.success(resp.data?.message || 'Registered successfully, please wait for our admin approval');
      setSubmitting(false);
      router.push('/auth/login/user');
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
      initialValues={{ country: undefined }}
    >
      <h1 style={{ color: 'var(--black)' }}>Member register</h1>
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
          },
          {
            validator: (rule, value) => {
              if (!value) return Promise.resolve();
              const years = moment().diff(value, 'years');
              if (years >= 18) {
                return Promise.resolve();
              }
              message.error('Minimum 18 years old');
              return null;
            }
          }
        ]}
      >
        <DatePicker placeholder="Date of Birth" />
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
            required: true,
            message: 'Please input your E-mail!'
          },
          {
            type: 'email',
            message: 'The input is not valid E-mail!'
          }
        ]}
      >
        <Input placeholder="E-mail" />
      </Form.Item>
      <Form.Item
        name="phone"
        rules={[
          { min: 9 },
          { max: 14 },
          {
            pattern: /^[0-9\b\\+ ]+$/,
            message: 'The phone number is not in the correct format'
          }
        ]}
      >
        <Input placeholder="Phone Number" />
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
      {error && (
        <Alert
          description={getResponseError(error)}
          type="error"
          message="Error"
        />
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
          I accept and agree to the
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
        Are you member?
        {' '}
        <Link href="/auth/login/user">
          <a>Login</a>
        </Link>
      </Form.Item>
      <Form.Item>
        Are you
        {' '}
        {singularTextModel || 'Performer'}
        ?
        {' '}
        <Link href={{ pathname: '/auth/register/model', query: { rel } }} as="/signup/model">
          <a>Signup now</a>
        </Link>
      </Form.Item>
    </Form>
  );
}

export default connector(UserRegisterFrom);
