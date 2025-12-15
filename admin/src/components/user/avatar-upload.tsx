import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import getConfig from 'next/config';
import { PureComponent } from 'react';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

interface IState {
  loading: boolean;
  imageUrl: string;
}

interface IProps {
  imageUrl?: string;
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  uploadNow?: boolean;
  beforeUpload?: Function;
}

export class AvatarUpload extends PureComponent<IProps, IState> {
  static defaultProps = {
    imageUrl: null,
    uploadUrl: null,
    headers: null,
    onUploaded: () => {},
    uploadNow: false,
    beforeUpload: () => {}
  };

  state = {
    loading: false,
    imageUrl: this.props.imageUrl
  };

  handleChange = (info) => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (imageUrl) => {
        this.setState({
          imageUrl,
          loading: false
        });
        this.props.onUploaded
          && this.props.onUploaded({
            response: info.file.response,
            base64: imageUrl
          });
      });
    }
  };

  beforeUpload(file) {
    const { publicRuntimeConfig: config } = getConfig();
    const ext = file.name.split('.').pop().toLowerCase();
    const isImageAccept = config.IMAGE_ACCPET.indexOf('image/*') !== -1 || config.IMAGE_ACCPET
      .split(',')
      .map((item: string) => item.trim())
      .indexOf(`.${ext}`) !== -1;
    if (!isImageAccept) {
      message.error(`You can only upload ${config.IMAGE_ACCPET} file!`);
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < (config.MAX_SIZE_IMAGE || 2);
    if (!isLt2M) {
      message.error(
        `Image must smaller than ${config.MAX_SIZE_IMAGE || 2}MB!`
      );
      return false;
    }
    if (this.props.uploadNow) {
      return isImageAccept && isLt2M;
    }

    if (isImageAccept && isLt2M) {
      this.props.beforeUpload && this.props.beforeUpload(file);
      getBase64(file, (imageUrl) => {
        this.setState({
          imageUrl
        });
      });
    }

    return false;
  }

  render() {
    const { publicRuntimeConfig: config } = getConfig();
    const uploadButton = (
      <div>
        {this.state.loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    const { imageUrl } = this.state;
    const { headers, uploadUrl } = this.props;
    return (
      <Upload
        name="avatar"
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action={uploadUrl}
        beforeUpload={this.beforeUpload.bind(this)}
        onChange={this.handleChange}
        headers={headers}
        accept={config.IMAGE_ACCPET || 'image/*'}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="avatar" style={{ width: '100%' }} />
        ) : (
          uploadButton
        )}
      </Upload>
    );
  }
}
