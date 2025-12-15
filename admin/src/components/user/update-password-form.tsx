import { Button, Form, Input } from 'antd';
import React from 'react';

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};

export function UpdatePaswordForm({ onFinish, updating = false }: any) {
  return (
    <Form
      name="nest-messages"
      onFinish={(data) => {
        // eslint-disable-next-line no-param-reassign
        delete data.confirm;
        onFinish(data);
      }}
      {...layout}
      layout="vertical"
    >
      {/* <Form.Item
        name="prePassword"
        label="Password"
        rules={[
          {
            required: true,
            message: 'Please input your old password!'
          },
          {
            min: 6,
            max: 14,
            message: '6-14 characters'
          }
        ]}
        hasFeedback
      >
        <Input.Password placeholder="Pre Password" />
      </Form.Item> */}
      <Form.Item
        name="password"
        label="New Password"
        rules={[
          { required: true, message: 'Please input your new password!' },
          {
            min: 6,
            max: 14,
            message: 'Passoword should be 6-14 characters'
          }
        ]}
        hasFeedback
      >
        <Input.Password placeholder="Enter password. At least 6 characters" />
      </Form.Item>
      <Form.Item
        name="confirm"
        label="Re-enter new password"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password!'
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
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
        <Input.Password placeholder="Re-enter new password. At least 6 characters" />
      </Form.Item>
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={updating}>
          Update
        </Button>
      </Form.Item>
    </Form>
  );
}
