import {
  Button, Form, Input, InputNumber
} from 'antd';
import React from 'react';
import { IFeaturedCreatorPackage } from 'src/interfaces';

interface IProps {
  handleOnFinish: Function;
  submitting: boolean;
  featuredPackage?: IFeaturedCreatorPackage;
}

export function FeaturedCreatorPackageForm({
  handleOnFinish,
  submitting,
  featuredPackage
}: IProps) {
  return (
    <Form
      name="featuredCreatorPackageForm"
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      initialValues={featuredPackage || {
        status: 'created'
      }}
      onFinish={(values: any) => handleOnFinish(values)}
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="price" label="Price per day" rules={[{ required: true }]}>
        <InputNumber controls={false} />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
