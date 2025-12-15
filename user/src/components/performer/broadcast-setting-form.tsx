import {
  Button, Checkbox, Col, Form, InputNumber, Row
} from 'antd';
import React from 'react';
import { IPerformer } from 'src/interfaces';

interface IProps {
  onFinish(data: any): Function;
  loading: boolean;
  performer: IPerformer;
}

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
      span: 16
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

function BroadcastSetting({ onFinish, performer, loading }: IProps) {
  const [form] = Form.useForm();
  return (
    <Form
      {...formItemLayout}
      form={form}
      onFinish={onFinish}
      name="broadcastSettingForm"
      className="performerEditForm"
      initialValues={{
        enablePeekIn: !!performer.enablePeekIn,
        peekInPrice: performer.peekInPrice || 0,
        peekInTimeLimit: performer.peekInTimeLimit || 0
      }}
      layout="vertical"
    >
      <Row gutter={25}>
        <Col sm={24} xs={24}>
          <Form.Item
            name="enablePeekIn"
            label="Enable Peek In for Private Chat"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        </Col>
        <Col sm={12} xs={24}>
          <Form.Item
            name="peekInPrice"
            label="Peek In Price (tokens)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col sm={12} xs={24}>
          <Form.Item
            name="peekInTimeLimit"
            label="Peek In Time Limit (seconds)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item {...tailFormItemLayout}>
        <Button
          type="primary"
          htmlType="submit"
          disabled={loading}
          loading={loading}
        >
          Save Changes
        </Button>
      </Form.Item>
    </Form>
  );
}

export default BroadcastSetting;
