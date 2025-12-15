/* eslint-disable no-nested-ternary */
import {
  Button,
  Col, Form, Input, Row, Select
} from 'antd';
import FormItem from 'antd/lib/form/FormItem';
import { useEffect } from 'react';
import { ICountry } from 'src/interfaces';

const PAYMENT_INFO_CURRENCY = {
  eurEuro: 'EUR (Euro)',
  usdUnitedStatesDollars: 'USD (U.S Dollar)'
};
const { Item } = Form;
const { Option } = Select;
const initFormValue = {
  type: 'wireTransfer',
  withdrawCurrency: 'eurEuro',
  taxPayer: ''
};
const formItemLayout = {
  labelCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 24
    }
  },
  wrapperCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 20
    }
  }
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0
    },
    sm: {
      span: 16,
      offset: 0
    }
  }
};

interface IProps {
  onFinish(data): Function;
  loading: boolean;
  paymentInformation: any;
  countries?: ICountry[];
}

export function WireTransferSettingForm({
  onFinish, loading, paymentInformation, countries = []
}: IProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(paymentInformation);
  }, [paymentInformation]);

  return (
    <Form
      {...formItemLayout}
      form={form}
      layout="vertical"
      onFinish={onFinish}
      name="paymentInfoSettingForm"
      className="performerEditForm"
      validateMessages={{ required: 'This field is required!' }}
      initialValues={{ ...initFormValue }}
    >
      <Row>
        <Col xs={24} sm={12}>
          <Item
            name="withdrawCurrency"
            key="withdrawCurrency"
            rules={[{ required: true }]}
            label="Withdraw Currency"
          >
            <Select>
              {Object.keys(PAYMENT_INFO_CURRENCY).map((key) => (
                <Option value={key} key={key}>
                  {PAYMENT_INFO_CURRENCY[key]}
                </Option>
              ))}
            </Select>
          </Item>
          <Item
            name="taxPayer"
            key="taxPayer"
            label="Taxpayer ID/SSN"
            rules={[
              { pattern: /^[a-zA-Z0-9]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="bankName"
            key="bankName"
            label="Bank Name"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input your Bank Name!' },
              { pattern: /^[a-zA-Z\s]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="bankAddress"
            key="bankAddress"
            label="Bank Address"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input your Bank Address!' },
              { pattern: /^[a-zA-Z0-9\s]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="bankSWIFTBICABA"
            key="bankSWIFTBICABA"
            label="Bank SWIFT-BIC/ABA"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input your Bank SWIFT-BIC/ABA!' },
              { pattern: /^[a-zA-Z0-9]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="additionalInformation"
            key="additionalInformation"
            label="Additional Information"
          >
            <Input.TextArea />
          </Item>
        </Col>
        <Col xs={24} sm={12}>
          <Item
            name="bankCountry"
            key="bankCountry"
            label="Bank Country"
            dependencies={['type']}
            rules={[{ required: true, message: 'Please select bank country!' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
            >
              {countries.map((c) => (
                <Option key={c.code} value={c.code} label={c.name}>
                  <img alt="flag" src={c?.flag} width="20px" />
                  {' '}
                  {c.name}
                </Option>
              ))}
            </Select>
          </Item>
          <Item
            name="bankState"
            key="bankState"
            label="Bank State"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input bank state!' },
              { pattern: /^[a-zA-Z\s]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="bankCity"
            key="bankCity"
            label="Bank City"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input bank city!' },
              { pattern: /^[a-zA-Z\s]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="bankZip"
            key="bankZip"
            label="Bank Zip"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input your Bank Zip!' },
              { pattern: /^[a-zA-Z0-9]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="bankAcountNumber"
            key="bankAcountNumber"
            label="Bank Account Number"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input your Bank Account Number!' },
              { pattern: /^[a-zA-Z0-9]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
          <Item
            name="holderOfBankAccount"
            key="holderOfBankAccount"
            label="Primary Account Holder"
            dependencies={['type']}
            rules={[
              { required: true, message: 'Please input the Primary Account Holder name!' },
              { pattern: /^[a-zA-Z\s]+$/, message: 'Invalid format!' }
            ]}
          >
            <Input />
          </Item>
        </Col>
      </Row>
      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" loading={loading}>
          Save Change
        </Button>
      </FormItem>
    </Form>
  );
}
