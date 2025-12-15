import {
  Button, Form, Input, InputNumber, Select
} from 'antd';
import React from 'react';
import { IFeaturedCreatorBooking } from 'src/interfaces';

interface IProps {
  handleOnFinish: Function;
  submitting: boolean;
  featuredPackage?: IFeaturedCreatorBooking;
}

function FeaturedCreatorBookingForm({
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
      <Form.Item name="name" label="Name">
        <Input readOnly />
      </Form.Item>
      <Form.Item name="price" label="Price per day">
        <InputNumber controls={false} readOnly />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input readOnly />
      </Form.Item>
      <Form.Item name="status" label="Status" required>
        <Select defaultValue="created">
          <Select.Option key="pending" value="pending" disabled>
            Pending
          </Select.Option>
          <Select.Option key="approved" value="approved" disabled={featuredPackage.status !== 'pending'}>
            Approved
          </Select.Option>
          <Select.Option key="rejected" value="rejected" disabled={featuredPackage.status !== 'pending'}>
            Rejected
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={submitting} disabled={featuredPackage.status !== 'pending'}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}

export default FeaturedCreatorBookingForm;
