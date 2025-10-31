import { getResponseError } from '@lib/utils';
import {
  Alert, Button, Form, Input, Select,
  Space
} from 'antd';
import Router from 'next/router';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

const mapStates = (state) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface IProps {
  loading: boolean;
  onFinish: Function;
  error: boolean;
  message: string;
}

function StudioAddModelForm({
  loading,
  error,
  message,
  onFinish,
  singularTextModel
}: IProps & PropsFromRedux) {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      name="studioAddModelForm"
      onFinish={(data) => onFinish(data)}
      scrollToFirstError
      style={{ margin: 'auto', textAlign: 'center', maxWidth: '400px' }}
    >
      <Form.Item
        name="firstName"
        rules={[
          { required: true, message: 'Please input first name!' },
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Alphanumeric'
          },
          {
            whitespace: true,
            message: 'Please input first name!'
          }
        ]}
      >
        <Input placeholder={`${singularTextModel}'s first name"`} />
      </Form.Item>
      <Form.Item
        name="lastName"
        rules={[
          { required: true, message: 'Please input last name!' },
          {
            pattern: /^[a-zA-Z0-9 ]*$/,
            message: 'Alphanumeric'
          },
          {
            whitespace: true,
            message: 'Please input last name!'
          }
        ]}
      >
        <Input placeholder={`${singularTextModel}'s last name"`} />
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
      <Form.Item name="gender" rules={[{ required: true, message: 'Please select your gender!' }]}>
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
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password!'
          },
          {
            min: 6,
            max: 14,
            message: '6-14 characters'
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

              return Promise.reject(new Error(
                'The two passwords that you entered do not match!'
              ));
            }
          })
        ]}
      >
        <Input.Password placeholder="Confirm Password" />
      </Form.Item>
      {error && (
        <Form.Item>
          <Alert
            description={getResponseError(message)}
            type="error"
            message="Error"
          />
        </Form.Item>
      )}
      <Form.Item style={{ textAlign: 'right' }}>
        <Space>
          <Button
            type="primary"
            onClick={() => Router.push('/studio/models')}
            className="btn-submit"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={loading}
            className="btn-submit"
          >
            Create
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

export default connector(StudioAddModelForm);
