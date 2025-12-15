import { DeleteOutlined, LoadingOutlined, PictureOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import { PureComponent } from 'react';

interface IProps {
  remove: Function;
  files: any[];
}

export default class UploadList extends PureComponent<IProps> {
  state = {
    previews: {} as Record<string, any>
  };

  renderPreview(file) {
    if (file.status === 'uploading') {
      return <LoadingOutlined />;
    }
    if (this.state.previews[file.uid]) {
      return <img src={this.state.previews[file.uid]} alt="" />;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      this.setState({
        previews: {
          // eslint-disable-next-line
          ...this.state.previews,
          [file.uid]: reader.result
        }
      });
    });
    reader.readAsDataURL(file);
    return <PictureOutlined />;
  }

  render() {
    return (
      <div className="ant-upload-list ant-upload-list-picture">
        {this.props.files.map((file) => (
          <div className="ant-upload-list-item ant-upload-list-item-uploading ant-upload-list-item-list-type-picture" key={file.uid}>
            <div className="ant-upload-list-item-info">
              <div>
                <span className="ant-upload-list-item-thumbnail ant-upload-list-item-file">
                  {this.renderPreview(file)}
                </span>
                <span className="ant-upload-list-item-name ant-upload-list-item-name-icon-count-1">
                  <span>{file.name}</span>
                </span>
                {file.percent !== 100
                  && (
                  <span className="ant-upload-list-item-card-actions picture">
                    <a href="#" onClick={() => this.props.remove.bind(this, file)}>
                      <DeleteOutlined />
                    </a>
                  </span>
                  )}

                {file.percent && <Progress percent={file.percent} />}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
