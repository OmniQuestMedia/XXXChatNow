import {
  Button, Form, Input, Select
} from 'antd';
import { AggregatorCategoryUpdate } from 'src/interfaces/aggregator-categories';

interface IProps {
  category?: AggregatorCategoryUpdate;
  onFinish: Function;
  submitting?: boolean;
}

export function FormAggregator({
  category = null,
  submitting = false,
  onFinish = () => { }
}: IProps) {
  const activeData = category.active.toString();
  return (
    <Form
      onFinish={onFinish.bind(this)}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      initialValues={
        {
          ...category,
          active: activeData
        }
      }
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="alias"
        label="Alias"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      {category.tags && category.tags.length > 0 && (
        <Form.Item
          name="tags"
          label="Tags"
          rules={[{ type: 'array', required: true }]}
          extra="You can use tag to search model!"
        >
          <Select mode="tags" />
        </Form.Item>
      )}

      <Form.Item name="metaTitle" label="Meta title">
        <Input placeholder="Google usually displays the first 50 to 60 characters of the title tag" />
      </Form.Item>

      <Form.Item name="metaKeywords" label="Meta keywords">
        <Input placeholder="Please enter meta keywords" />
      </Form.Item>

      <Form.Item name="metaDescription" label="Meta description">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item
        name="active"
        label="Status"
        rules={[{ required: true, message: 'Please select status!' }]}
      >
        <Select>
          <Select.Option key="active" value="true">
            Active
          </Select.Option>
          <Select.Option key="inactive" value="false">
            Inactive
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 4 }}>
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

export default FormAggregator;
