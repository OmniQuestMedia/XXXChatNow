import { Form, Input, Modal } from 'antd';

interface IProps {
visible: boolean;
onCancel: Function;
onOk: any;
}

function CommunityChatGroupCreationPopup({
  visible,
  onCancel,
  onOk
}: IProps) {
  const [form] = Form.useForm();

  return (
    <Modal
      width={520}
      forceRender
      title="Conversation creation form"
      onCancel={() => onCancel()}
      okText="Create"
      okType="primary"
      onOk={() => form.submit()}
      visible={visible}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onOk}
      >
        <Form.Item
          label="Conversation name"
          name="name"
          rules={[{
            required: true,
            message: 'Conversation name is required'
          }]}
        >
          <Input placeholder="Enter the name of the conversation" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CommunityChatGroupCreationPopup;
