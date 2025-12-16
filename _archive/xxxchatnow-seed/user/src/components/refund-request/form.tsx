import FormInputItem from '@components/common/base/input-item-list';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space
} from 'antd';
import { FormItemProps } from 'antd/lib/form/FormItem';
import Router from 'next/router';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IOrder, IPerformer, IRefundRequest } from 'src/interfaces';
import { formItemLayout, tailFormItemLayout } from 'src/lib';

interface IProps {
  onFinish(data: any): Function;
  loading: boolean;
  performers?: IPerformer[];
  products?: IOrder[];
  onChangePerformer: Function;
}

const mapStates = (state: any) => ({
  singularTextModel: state.ui.singularTextModel
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

const initialValues: Partial<IRefundRequest> = {
  description: '',
  sourceId: '',
  sourceType: 'order',
  performerId: '',
  token: 0
};

function RefundRequestForm({
  onFinish,
  loading,
  performers = [],
  products = [],
  onChangePerformer,
  singularTextModel = 'Performer'
}: IProps & PropsFromRedux) {
  const [form] = Form.useForm();
  const performerSelectOptions = performers && performers.map((per) => ({
    label: per.username,
    value: per._id
  }));
  const productSelectOptions = products && products.map((prod) => ({
    label: `${prod.productsInfo && prod.productsInfo[0] ? prod.productsInfo[0].name : 'N/A'} - ${prod.orderNumber}`,
    value: prod._id
  }));

  const leftFormItem: FormItemProps[] = [
    {
      name: 'performerId',
      label: singularTextModel,
      rules: [
        {
          required: true,
          message: `Please select ${singularTextModel}!`
        }
      ],
      children: (
        <Select
          showSearch
          optionFilterProp="label"
          placeholder={`Please Select ${singularTextModel}`}
          options={performerSelectOptions}
          onChange={(value) => { form.setFieldsValue({ sourceId: '' }); onChangePerformer(value); }}
          dropdownRender={(menu) => menu}
        />
      )
    },
    {
      name: 'description',
      label: 'Description',
      children: <Input.TextArea placeholder="Enter Description" />
    }
  ];
  const rightInputFrom: FormItemProps[] = [
    {
      name: 'sourceId',
      label: 'Product',
      rules: [
        {
          required: true,
          message: 'Please select product!'
        }
      ],
      children: (
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Please Select Product"
          options={productSelectOptions}
          onChange={(value) => {
            const prod = products.find((p) => p._id === value);
            prod && form.setFieldsValue({ token: prod.totalPrice });
          }}
          dropdownRender={(menu) => menu}
        />
      )
    },
    {
      name: 'token',
      label: 'Token',
      rules: [
        {
          required: true,
          message: 'Please input product token!'
        }
      ],
      children: (
        <InputNumber min={1} disabled />
      )
    }
  ];

  return (
    <Form
      {...formItemLayout}
      form={form}
      onFinish={onFinish}
      name="productsForm"
      className="product-form"
      initialValues={{ ...initialValues }}
      layout="vertical"
    >
      <Row gutter={25}>
        <Col sm={12} xs={24} md={12} lg={12}>
          <FormInputItem fields={leftFormItem} />
        </Col>
        <Col sm={12} xs={24} md={12} lg={12}>
          <FormInputItem fields={rightInputFrom} />
        </Col>
      </Row>
      <Form.Item {...tailFormItemLayout}>
        <Space>
          <Button type="primary" htmlType="submit" disabled={loading} loading={loading}>
            Save Changes
          </Button>
          <Button
            type="primary"
            onClick={() => Router.push('/account/user/refund-request')}
          >
            Back
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

export default connector(RefundRequestForm);
