import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import { useState } from 'react';

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

interface IProps {
  imageUrl?: string;
  uploadUrl?: string;
  headers?: any;
  onUploaded?: Function;
  options?: any;
  beforeUpload?: Function;
}

export function ImageUpload({
  imageUrl = '',
  uploadUrl = '',
  headers = null,
  options = {},
  onUploaded = () => {},
  beforeUpload = () => {}
}: IProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState(imageUrl);
  const [loading, setLoading] = useState(false);

  const handleChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.fileList[0].originFileObj, (dataUrl) => {
        setPreviewImageUrl(dataUrl);
        setLoading(false);
        onUploaded({
          response: info.file.response,
          base64: imageUrl
        });
      });
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  return (
    <Upload
      name={options.fieldName || 'file'}
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      action={uploadUrl}
      beforeUpload={(file, fileList) => beforeUpload(file, fileList)}
      onChange={handleChange}
      headers={headers}
    >
      {previewImageUrl ? (
        <img src={previewImageUrl} alt="file" style={{ width: '100%', height: '100%' }} />
      ) : (
        uploadButton
      )}
    </Upload>
  );
}

export default ImageUpload;
