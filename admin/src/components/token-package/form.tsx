import {
  Button, Checkbox, Form, Input, InputNumber
} from 'antd';
import { ITokenPackage, ITokenPackageCreate } from 'src/interfaces';

interface IProps {
  tokenPackage?: Partial<ITokenPackage>;
  onFinish: Function;
  submitting?: boolean;
}

export function FormTokenPackage({
  tokenPackage,
  onFinish,
  submitting = false
}: IProps) {
  return (
    <Form
      onFinish={onFinish.bind(this)}
      initialValues={
        tokenPackage || ({
          name: '',
          price: 1,
          tokens: 1,
          isActive: true,
          ordering: 0,
          description: ''
        } as ITokenPackageCreate)
      }
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: 'Please input name!' }]}
        label="Name"
      >
        <Input placeholder="Enter package's name" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price"
        rules={[{ required: true, message: 'Please input price!' }]}
      >
        <InputNumber placeholder="Please input price of package" min={1} />
      </Form.Item>

      <Form.Item
        name="tokens"
        label="Number of tokens"
        rules={[{ required: true, message: 'Please input tokens!' }]}
      >
        <InputNumber
          placeholder="Please input number of tokens in package"
          min={1}
        />
      </Form.Item>

      <Form.Item name="ordering" label="Ordering">
        <InputNumber />
      </Form.Item>
      <Form.Item name="isActive" valuePropName="checked" label="Active?">
        <Checkbox />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item labelCol={{ span: 0 }} wrapperCol={{ span: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          style={{ float: 'right' }}
          loading={submitting}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}

export default FormTokenPackage;
