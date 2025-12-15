import { UploadOutlined } from '@ant-design/icons';
import { getResponseError } from '@lib/utils';
import { performerService } from '@services/perfomer.service';
import {
  Button,
  Checkbox, Form, Input, InputNumber, message, Select, Upload
} from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { omit } from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const Loader = dynamic(() => import('@components/common/base/loader'));

const formItemLayout = {
  labelCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 24
    },
    md: {
      span: 6
    }
  },
  wrapperCol: {
    xs: {
      span: 24
    },
    sm: {
      span: 24
    },
    md: {
      span: 16
    }
  }
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 10
    },
    sm: {
      span: 24,
      offset: 10
    }
  }
};

function WatermarkSettingPage() {
  const [loading, setloading] = useState(false);
  const [form] = useForm();
  const [image, setImage] = useState();

  const loadConfig = async () => {
    try {
      setloading(true);
      const resp = await performerService.loadWatermarkerConfigs();
      if (resp.data) {
        delete resp.data.watermarkImageId;
        form.setFieldsValue(resp.data);
        if (resp.data.watermarkImage) setImage(resp.data.watermarkImage);
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setloading(false);
    }
  };

  const onFinish = async (data) => {
    try {
      setloading(true);
      await performerService.updateWatermarkerConfigs(omit(data, 'image'), data.image?.file);
      message.success('Updated successfully');
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div>
      <PageTitle title="Watermark" />
      <PageHeader
        title="Watermark"
      />
      <Loader spinning={loading} />
      <Form
        form={form}
        {...formItemLayout}
        onFinish={onFinish}
        initialValues={{
          type: 'image',
          watermarkEnabled: false,
          watermarkStreamEnabled: false,
          watermarkText: '',
          watermarkColor: '#ffffff',
          watermarkFontSize: 24,
          watermarkOpacity: 1,
          watermarkBottom: 10,
          watermarkTop: 20,
          watermarkLeft: 10,
          watermarkAlign: 'top'
        }}
      >
        <Form.Item name="watermarkEnabled" label="Enable content watermark" valuePropName="checked">
          <Checkbox />
        </Form.Item>
        <Form.Item name="watermarkStreamEnabled" label="Enable live streaming watermark" valuePropName="checked">
          <Checkbox />
        </Form.Item>
        <Form.Item name="type" label="Type">
          <Select>
            <Select.Option value="image">Image</Select.Option>
            <Select.Option value="text">Text</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Image file" name="image">
          <Upload beforeUpload={() => false} maxCount={1}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
            <br />
            {image && <a href={image} target="_blank" rel="noreferrer">{image}</a>}
          </Upload>
        </Form.Item>
        <Form.Item name="watermarkText" label="Text">
          <Input />
        </Form.Item>
        <Form.Item name="watermarkColor" label="Text color">
          <Input />
        </Form.Item>
        <Form.Item name="watermarkFontSize" label="Text font size">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="watermarkOpacity" label="Text opacity">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="watermarkBottom" label="Text bottom padding">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="watermarkTop" label="Text top padding">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="watermarkLeft" label="Text left padding">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Text align" name="watermarkAlign">
          <Select>
            <Select.Option value="top">Top</Select.Option>
            <Select.Option value="middle">Middle</Select.Option>
            <Select.Option value="bottom">Bottom</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item {...tailFormItemLayout}>
          <Button type="primary" htmlType="submit">Save Changes</Button>
        </Form.Item>
      </Form>
    </div>
  );
}

WatermarkSettingPage.authenticate = true;
WatermarkSettingPage.layout = 'primary';

export default WatermarkSettingPage;
