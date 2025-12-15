import FormInputItem from '@components/common/base/input-item-list';
import {
  Button, Form, InputNumber
} from 'antd';
import { FormItemProps } from 'antd/lib/form/FormItem';
import React from 'react';
import { IPerformer } from 'src/interfaces';
import { formItemLayout, tailFormItemLayout } from 'src/lib';

const leftFormItem: FormItemProps[] = [
  {
    name: 'privateCallPrice',
    rules: [
      {
        validator: (_, value) => new Promise((resolve, reject) => {
          if (parseInt(value, 10) > 0) {
            resolve(null);
          } else {
            reject(new Error('The price must be greater than 0!'));
          }
        })
      }
    ],
    label: 'Private call tokens/minute',
    children: <InputNumber type="number" />
  },
  {
    name: 'groupCallPrice',
    rules: [
      {
        validator: (_, value) => new Promise((resolve, reject) => {
          if (parseInt(value, 10) > 0) {
            resolve(null);
          } else {
            reject(new Error('The price must be greater than 0!'));
          }
        })
      }
    ],
    label: 'Group call tokens/minute',
    children: <InputNumber type="number" />
  },
  {
    name: 'spinWheelPrice',
    rules: [
      {
        validator: (_, value) => new Promise((resolve, reject) => {
          if (parseInt(value, 10) > 0) {
            resolve(null);
          } else {
            reject(new Error('The price must be greater than 0!'));
          }
        })
      }
    ],
    label: 'Spin wheel price',
    children: <InputNumber type="number" />
  }
];

const initFormValue = {
  privateCallPrice: 0,
  groupCallPrice: 0,
  spinWheelPrice: 0
};

interface IProps extends IPerformer {
  onFinish(data): Function;
  loading: boolean;
}

export default function defaultPrice({
  onFinish,
  privateCallPrice,
  groupCallPrice,
  spinWheelPrice,
  loading
}: IProps) {
  const [form] = Form.useForm();
  return (
    <Form
      {...formItemLayout}
      form={form}
      layout="vertical"
      onFinish={onFinish}
      name="defaultPriceForm"
      className="performerEditForm"
      initialValues={{ ...initFormValue, privateCallPrice, groupCallPrice, spinWheelPrice }}
    >
      <FormInputItem fields={leftFormItem} />
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" loading={loading}>
          Save Change
        </Button>
      </Form.Item>
    </Form>
  );
}
