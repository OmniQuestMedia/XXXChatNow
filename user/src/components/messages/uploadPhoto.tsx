import { message, Upload } from 'antd';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

function beforeUpload(file) {
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('Image must smaller than 5MB!');
  }
  return isLt5M;
}

type IProps = {
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  onFileReaded?: Function;
  options?: any;
  messageData?: any;
}

export function ImageMessageUpload({
  uploadUrl = '',
  headers = null,
  options = {},
  messageData = {},
  onUploaded = () => {},
  onFileReaded = () => {}
}: IProps) {
  const handleChange = (info: any) => {
    // if (info.file.status === 'uploading') {
    //   this.setState({ loading: true });
    //   return;
    // }
    if (info.file.status === 'done') {
      onFileReaded(info.file.originFileObj);
      // Get this url from response in real world.
      getBase64(info.fileList[0].originFileObj, (imageUrl) => {
        onUploaded({
          response: info.file.response,
          base64: imageUrl
        });
      });
    }
  };

  return (
    <Upload
      accept={'image/*'}
      name={options.fieldName || 'file'}
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      action={uploadUrl}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      headers={headers}
      data={messageData}
    >
      <div className="ant-upload-text">Upload</div>
    </Upload>
  );
}

export default ImageMessageUpload;
