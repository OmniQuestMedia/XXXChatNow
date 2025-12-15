import {
  Button, Form, Input, InputNumber
} from 'antd';
import React from 'react';

interface IProps {
  crowdfunding?: any;
  submitting: boolean;
  onFinish: Function;
}

function CrowdfundingForm({ crowdfunding = null, submitting, onFinish }: IProps) {
  return (
    <Form
      name="crowdfunding"
      layout="horizontal"
      autoComplete="off"
      onFinish={(value) => onFinish(value)}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      style={{ width: 800, margin: '0 auto' }}
      initialValues={crowdfunding || {}}
    >
      <Form.Item name="title" label="Title">
        <Input />
      </Form.Item>
      <Form.Item name="descriptions" label="Descriptions">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="token" label="Token">
        <InputNumber />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6 }}>
        <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
          Save
        </Button>
      </Form.Item>
    </Form>
  );
}

export default CrowdfundingForm;
