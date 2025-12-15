import { Button, Form, Input } from 'antd';
import React from 'react';

export function UpdatePaswordForm({ onFinish, updating = false }: any) {
  return (
    <Form name="nest-messages" onFinish={onFinish.bind(this)}>
      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Please input your password!', min: 6 }]}
      >
        <Input.Password placeholder="Enter password. At least 6 characters" />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" disabled={updating} loading={updating}>
          Update
        </Button>
      </Form.Item>
    </Form>
  );
}
