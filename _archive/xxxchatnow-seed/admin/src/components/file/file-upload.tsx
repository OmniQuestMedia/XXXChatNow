import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import getConfig from 'next/config';
import { PureComponent } from 'react';

function beforeUpload(file) {
  const { publicRuntimeConfig: config } = getConfig();
  const isLt2M = file.size / 1024 / 1024 < (config.MAX_SIZE_FILE || 20);
  if (!isLt2M) {
    message.error(
      `File must smaller than ${config.MAX_SIZE_FILE || 20}MB!`
    );
  }
  return isLt2M;
}

interface IState {
  loading: boolean;
  fileUrl: string;
}

interface IProps {
  fieldName?: string;
  fileUrl?: string;
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  method?: 'POST' | 'PUT' | 'post' | 'put';
}

export class FileUpload extends PureComponent<IProps, IState> {
  state = {
    loading: false,
    fileUrl: this.props.fileUrl
  };

  handleChange = (info) => {
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      this.setState({
        loading: false,
        fileUrl: info.file.response.data ? info.file.response.data.url : 'Done!'
      });
      this.props.onUploaded
        && this.props.onUploaded({
          response: info.file.response
        });
    }
  };

  render() {
    const uploadButton = (
      <div>
        {this.state.loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    const { fileUrl } = this.state;
    const { uploadUrl, fieldName = 'file' } = this.props;
    return (
      <Upload
        name={fieldName}
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action={uploadUrl}
        beforeUpload={beforeUpload}
        onChange={this.handleChange}
        {...this.props}
      >
        {fileUrl ? <span>Click to download</span> : uploadButton}
      </Upload>
    );
  }
}
