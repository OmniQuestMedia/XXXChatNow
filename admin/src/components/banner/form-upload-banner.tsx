import { UploadOutlined } from '@ant-design/icons';
import { ThumbnailBanner } from '@components/banner/thumbnail-banner';
import {
  Button, Form, Input, message, Progress, Select, Upload
} from 'antd';
import { FormInstance } from 'antd/lib/form';
import TextArea from 'antd/lib/input/TextArea';
import getConfig from 'next/config';
import {
  createRef, useEffect, useRef, useState
} from 'react';
import { IBannerCreate, IBannerUpdate } from 'src/interfaces';

interface IProps {
  banner?: IBannerUpdate;
  submit?: Function;
  beforeUpload?: Function;
  uploading?: boolean;
  uploadPercentage?: number;
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};

const validateMessages = {
  required: 'This field is required!'
};

export function FormUploadBanner({
  banner, beforeUpload: handleUpload, submit, uploading, uploadPercentage
}: IProps) {
  const [preview, setPreview] = useState(null);
  const [type, setType] = useState('img');
  let formRef = useRef() as any;

  // eslint-disable-next-line
  const setFormVal = (field: string, val: any) => {
    const instance = formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  };

  const beforeUpload = (file) => {
    const { publicRuntimeConfig: config } = getConfig();
    const isMaxSize = file.size / 1024 / 1024 < (config.MAX_SIZE_IMAGE || 10);
    if (!isMaxSize) {
      message.error(
        `Image must be smaller than ${config.MAX_SIZE_IMAGE || 10}MB!`
      );
      return false;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => setPreview(reader.result));
    reader.readAsDataURL(file);
    handleUpload(file);
    return false;
  };

  const onSelect = (_type: string) => {
    setType(_type);
  };

  useEffect(() => {
    if (formRef) formRef = createRef();
    if (banner?.type === 'img') {
      setType('img');
    } else if (banner?.type === 'html') {
      setType('html');
    }
  }, []);

  const haveBanner = !!banner;
  const { publicRuntimeConfig: config } = getConfig();
  return (
    <Form
      {...layout}
      onFinish={submit && submit.bind(this)}
      onFinishFailed={() => message.error('Please complete the required fields')}
      name="form-upload-banner"
      ref={formRef}
      validateMessages={validateMessages}
      initialValues={
      banner
      || ({
        title: '',
        description: '',
        href: '',
        status: 'active',
        position: 'top',
        type: 'img'
      } as IBannerCreate)
    }
    >
      <Form.Item
        name="title"
        rules={[{ required: true, message: 'Please input title of banner!' }]}
        label="Title"
      >
        <Input placeholder="Enter banner title" />
      </Form.Item>
      <Form.Item
        name="position"
        label="Position"
        rules={[{ required: true, message: 'Please select position!' }]}
      >
        <Select>
          <Select.Option key="top" value="top">
            Top
          </Select.Option>
          <Select.Option key="bottom" value="bottom">
            Bottom
          </Select.Option>
          <Select.Option key="right" value="right">
            Right
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="href" label="Link"><Input type="url" placeholder="Enter banner link" /></Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select status!' }]}
      >
        <Select>
          <Select.Option key="active" value="active">
            Active
          </Select.Option>
          <Select.Option key="inactive" value="inactive">
            Inactive
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="type"
        label="Type"
        rules={[{ required: true, message: 'Please select type for banner!' }]}
      >
        <Select onSelect={onSelect.bind(this)} disabled={!!banner?._id}>
          <Select.Option key="img" value="img">
            Image
          </Select.Option>
          <Select.Option key="html" value="html">
            HTML
          </Select.Option>
        </Select>
      </Form.Item>
      {type === 'html' && (
      <Form.Item
        name="contentHTML"
        label="HTML"
      >
        <TextArea rows={3} />
      </Form.Item>
      )}
      {type === 'img' && (
        <div key="thumbnail" className="ant-row ant-form-item">
          <div className="ant-col ant-col-4 ant-form-item-label">
            <label>Banner </label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            <p>Ratio dimension 4:1 (eg: 1600px:400px)</p>
            {!haveBanner ? (
              <>
                <Upload
                  accept={'image/*'}
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading || haveBanner}
                  beforeUpload={(file) => beforeUpload(file)}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="file"
                      style={{ width: '250px', marginBottom: '10px' }}
                    />
                  ) : null}
                  <div style={{ clear: 'both' }} />
                  {!haveBanner && (
                    <Button>
                      <UploadOutlined />
                      {' '}
                      Select File
                    </Button>
                  )}
                </Upload>
                {uploadPercentage ? (
                  <Progress percent={uploadPercentage} />
                ) : null}
              </>
            ) : (
              <ThumbnailBanner banner={banner} style={{ width: '250px' }} />
            )}
            <div className="ant-form-item-explain">
              <div>
                Image must smaller than
                {' '}
                {config.MAX_SIZE_IMAGE || 10}
                {' '}
                MB!
              </div>
            </div>
          </div>
        </div>
      )}
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={uploading}>
          {haveBanner ? 'Update' : 'Upload'}
        </Button>
      </Form.Item>
    </Form>
  );
}
