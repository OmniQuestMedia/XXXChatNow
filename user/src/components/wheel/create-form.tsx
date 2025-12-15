import { ColorPicker } from '@components/common/base/color-picker';
import { IWheelOption } from '@interfaces/wheel-option';
import {
  Button, Col, Form, Input, Row, Select
} from 'antd';

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

type IProps = {
  onFinish: Function;
  loading: boolean;
  option: IWheelOption;
}

export function CreateWheelOptionForm({ onFinish, loading, option }: IProps) {
  const [form] = Form.useForm();

  return (
    <Form
      {...layout}
      name="create-wheel-option-form"
      onFinish={onFinish.bind(this)}
      form={form}
      labelAlign="left"
      className="account-form"
      initialValues={option || { }}
    >
      <Row>
        <Col xl={12} md={12} xs={12}>
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Please input wheel-option name!' }
            ]}
          >
            <Input placeholder="Name" />
          </Form.Item>
        </Col>
        <Col xl={12} md={12} xs={12}>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please input wheel-option description!' }
            ]}
          >
            <Input placeholder="Description" />
          </Form.Item>
        </Col>
        <Col xl={12} md={12} xs={12}>
          <Form.Item name="status" label="Status">
            <Select defaultValue={{ value: 'active', label: 'Active' }}>
              <Select.Option key="active" value="active">
                Active
              </Select.Option>
              <Select.Option key="inactive" value="inactive">
                Inactive
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xl={12} md={12} xs={12}>
          <Form.Item name="color" label="Color">
            <ColorPicker
              defaultValue={option.color}
              onChange={() => {}}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item className="text-center">
        <Button
          className="primary"
          htmlType="submit"
          loading={loading}
          disabled={loading}
        >
          {option._id ? 'Update' : 'Create'}
        </Button>
      </Form.Item>
    </Form>
  );
}
