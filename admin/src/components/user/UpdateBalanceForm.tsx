import { Button, Form, InputNumber } from 'antd';

type TUpdateBalanceForm = {
  onFinish: Function;
  balance: number | string;
  updating: boolean;
}

export function UpdateBalanceForm({
  onFinish = () => {},
  balance = 0,
  updating = false
}: TUpdateBalanceForm) {
  const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 16 }
  };

  return (
    <Form
      name="nest-messages"
      onFinish={onFinish.bind(this)}
      {...layout}
      initialValues={{
        balance
      }}
    >
      <Form.Item
        name="balance"
        label="Balance"
        rules={[
          { required: true, message: 'Enter balance you want to update!' }
        ]}
      >
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={updating}>
          Update
        </Button>
      </Form.Item>
    </Form>
  );
}
