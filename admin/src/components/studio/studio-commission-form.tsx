import {
  Button, Form, InputNumber, message
} from 'antd';
import { IStudio } from 'src/interfaces';

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 }
};

const validateMessages = {
  required: 'This field is required!'
};

interface IProps {
  onFinish: Function;
  studio?: IStudio;
  submiting?: boolean;
}

export function StudioCommissionForm({
  onFinish = () => {},
  studio = {} as any,
  submiting = false
}: IProps) {
  const validator = (_, value: any) => {
    if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error('Value must be greater than 0 and less than 100')
    );
  };

  return (
    <Form
      layout="vertical"
      name="form-studio-commission"
      onFinish={onFinish.bind(this)}
      onFinishFailed={() => message.error('Please complete the required fields.')}
      validateMessages={validateMessages}
      initialValues={
          {
            tipCommission: studio.tipCommission || 60,
            privateCallCommission: studio.privateCallCommission || 60,
            groupCallCommission: studio.groupCallCommission || 60,
            productCommission: studio.productCommission || 60,
            albumCommission: studio.albumCommission || 60,
            videoCommission: studio.videoCommission || 60
          }
      }
    >
      <Form.Item
        name="tipCommission"
        label="Tip Commission"
        rules={[
          { validator }
        ]}
      >
        <InputNumber min={1} max={99} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="privateCallCommission"
        label="Private Call Commission"
        rules={[
          {
            validator
          }
        ]}
      >
        <InputNumber min={1} max={99} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="groupCallCommission"
        label="Group Call Commission"
        rules={[
          { validator }
        ]}
      >
        <InputNumber min={1} max={99} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="productCommission"
        label="Product Sale Commission"
        rules={[
          { validator }
        ]}
      >
        <InputNumber min={1} max={99} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="albumCommission"
        label="Album Sale Commission"
        rules={[
          { validator }
        ]}
      >
        <InputNumber min={1} max={99} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="videoCommission"
        label="Video Sale Commission"
        rules={[
          { validator }
        ]}
      >
        <InputNumber min={1} max={99} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item wrapperCol={{ ...layout.wrapperCol }}>
        <Button type="primary" htmlType="submit" loading={submiting}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}

export default StudioCommissionForm;
