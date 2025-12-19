import { UploadOutlined } from '@ant-design/icons';
import { SelectPerformerDropdown } from '@components/performer/common/select-performer-dropdown';
import { ThumbnailVideo } from '@components/video/thumbnail-video';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Progress,
  Select,
  Switch,
  Upload
} from 'antd';
import { FormInstance } from 'antd/lib/form';
import getConfig from 'next/config';
import { createRef, PureComponent } from 'react';
import { IVideoCreate, IVideoUpdate } from 'src/interfaces';

interface IProps {
  video?: IVideoUpdate;
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

export class FormUploadVideo extends PureComponent<IProps> {
  static defaultProps = {
    video: null,
    submit: () => {},
    beforeUpload: () => {},
    uploading: false,
    uploadPercentage: 100
  };

  state = {
    previewThumbnail: null,
    previewVideo: null,
    isSale: false
  };

  formRef: any;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { video } = this.props;
    if (video) {
      this.setState(
        {
          previewThumbnail: video.thumbnail ? video.thumbnail : null,
          previewVideo: video.video && video.video.url ? video.video.url : null,
          isSale: !!video.isSaleVideo
        },
        () => {
          if (this.state.previewVideo) {
            const videoEl = document.getElementById('video') as HTMLVideoElement;
            videoEl.setAttribute('src', this.state.previewVideo);
          }
        }
      );
    }
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  beforeUpload(file, field) {
    const reader = new FileReader();
    reader.addEventListener('load', () => this.setState(
      field === 'thumbnail'
        ? {
          previewThumbnail: reader.result
        }
        : {
          previewVideo: reader.result
        },
      () => {
        if (field === 'video') {
          const video = document.getElementById('video') as HTMLVideoElement;
          video.setAttribute('src', reader.result.toString());
        }
      }
    ));
    reader.readAsDataURL(file);
    this.props.beforeUpload(file, field);
    return false;
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const {
      video, submit, uploading, uploadPercentage
    } = this.props;
    const { previewThumbnail, previewVideo, isSale } = this.state;
    const haveVideo = !!video;
    const { publicRuntimeConfig: config } = getConfig();
    return (
      <Form
        {...layout}
        onFinish={submit && submit.bind(this)}
        onFinishFailed={() => message.error('Please complete the required fields')}
        name="form-upload"
        ref={this.formRef}
        validateMessages={validateMessages}
        initialValues={
          video || ({
            title: '',
            token: 0,
            description: '',
            status: 'draft',
            performerId: '',
            isSaleVideo: video?.isSaleVideo
          } as IVideoCreate)
        }
      >
        <Form.Item
          name="performerId"
          label="Performer"
          rules={[{ required: true }]}
        >
          <SelectPerformerDropdown
            disabled={haveVideo}
            defaultValue={video && video.performerId}
            onSelect={(val) => this.setFormVal('performerId', val)}
          />
        </Form.Item>
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'Please input title of video!' }]}
          label="Title"
        >
          <Input placeholder="Enter video title" />
        </Form.Item>
        <Form.Item name="isSaleVideo" label="Is Sale?">
          <Switch
            defaultChecked={video?.isSaleVideo}
            onChange={(checked) => {
              this.setFormVal('isSaleVideo', checked);
              this.setState({ isSale: checked });
            }}
          />
        </Form.Item>
        <Form.Item name="token" label="Token">
          <InputNumber disabled={!isSale} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select status!' }]}
        >
          <Select>
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option key="active" value="active">
              Active
            </Select.Option>
            <Select.Option key="inactive" value="inactive">
              Inactive
            </Select.Option>
          </Select>
        </Form.Item>
        <>
          <div key="thumbnail" className="ant-row ant-form-item">
            <div className="ant-col ant-col-4 ant-form-item-label">
              <label>Thumbnail</label>
            </div>
            <div className="ant-col ant-col-16 ant-form-item-control">
              {!haveVideo ? (
                <Upload
                  accept={config.IMAGE_ACCPET || 'image/*'}
                  multiple={false}
                  showUploadList={false}
                  disabled={uploading || haveVideo}
                  beforeUpload={(file) => this.beforeUpload(file, 'thumbnail')}
                >
                  {previewThumbnail ? (
                    <img
                      src={previewThumbnail}
                      alt="file"
                      style={{ width: '250px', marginBottom: '10px' }}
                    />
                  ) : null}
                  <div style={{ clear: 'both' }} />
                  {!haveVideo && (
                    <Button>
                      <UploadOutlined />
                      {' '}
                      Select File
                    </Button>
                  )}
                </Upload>
              ) : (
                <ThumbnailVideo video={video} style={{ width: '250px' }} />
              )}
              <div className="ant-form-item-explain">
                <div>
                  Image must smaller than
                  {' '}
                  {config.MAX_SIZE_IMAGE || 2}
                  MB!
                </div>
              </div>
            </div>
          </div>
          <div key="video" className="ant-row ant-form-item">
            <div className="ant-col ant-col-4 ant-form-item-label">
              <label>Video</label>
            </div>
            <div className="ant-col ant-col-16 ant-form-item-control">
              <Upload
                accept={config.VIDEO_ACCEPT || 'video/*,.mkv'}
                multiple={false}
                showUploadList={false}
                disabled={uploading || haveVideo}
                beforeUpload={(file) => this.beforeUpload(file, 'video')}
              >
                {previewVideo ? (
                  <video
                    controls
                    id="video"
                    style={{ width: '250px', marginBottom: '10px' }}
                  />
                ) : null}
                <div style={{ clear: 'both' }} />
                {!haveVideo && (
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
              <div className="ant-form-item-explain">
                <div>
                  Video must smaller than
                  {' '}
                  {config.MAX_SIZE_VIDEO || 20}
                  MB!
                </div>
              </div>
            </div>
          </div>
        </>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={uploading}>
            {haveVideo ? 'Update' : 'Upload'}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
