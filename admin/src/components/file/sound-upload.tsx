/* eslint-disable no-param-reassign */
import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import getConfig from 'next/config';
import { PureComponent } from 'react';

function beforeUpload(file) {
  const { publicRuntimeConfig: config } = getConfig();
  const isLt2M = file.size / 1024 / 1024 < (config.MAX_SIZE_FILE || 2);
  if (!isLt2M) {
    message.error(
      `Image must smaller than ${config.MAX_SIZE_IMAGE || 2}MB!`
    );
  }
  return isLt2M;
}

interface IState {
  loading: boolean;
  fileList?: any;
}

interface IProps {
  fileUrl?: any;
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  options?: any;
}

export default class SoundUpload extends PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: false
    };
  }

  componentDidMount() {
    const { fileUrl } = this.props;
    if (fileUrl) {
      this.setState({
        fileList: [
          {
            uid: '-1',
            name: fileUrl,
            status: 'done',
            url: fileUrl
          }
        ]
      });
    }
  }

  handleChange = (info) => {
    const { onUploaded } = this.props;
    if (info.file.status === 'uploading') {
      this.setState({ loading: true });
    }

    if (info.file.status === 'done') {
      this.setState({ loading: false });
    }

    let fileList = [...info.fileList];
    fileList = fileList.slice(-1);
    fileList = fileList.map((file) => {
      if (file.response) {
        const { data } = file.response;
        file.url = data.url;
        file.uid = data._id;
        file.name = data.name;
        file.status = 'done';
        onUploaded
          && onUploaded({
            response: info.file.response
          });
        this.setState({ loading: false });
      }
      return file;
    });
    this.setState({ fileList });
  };

  render() {
    const { options = {} } = this.props;
    const { fileList, loading } = this.state;
    const { headers, uploadUrl } = this.props;
    const { publicRuntimeConfig: config } = getConfig();
    function UploadButton() {
      return (
        <div>
          <Button type="primary" loading={loading}>
            <PlusOutlined />
            {' '}
            Upload
          </Button>
        </div>
      );
    }
    return (
      <Upload
        name={options.fieldName || 'file'}
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: false,
          showDownloadIcon: false
        }}
        fileList={fileList}
        multiple={false}
        listType="text"
        className="avatar-uploader"
        action={uploadUrl}
        beforeUpload={beforeUpload}
        onChange={this.handleChange}
        headers={headers}
        accept={config.SOUND_ACCEPT}
      >
        <UploadButton />
      </Upload>
    );
  }
}
