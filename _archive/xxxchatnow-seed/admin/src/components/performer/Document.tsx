import { FileUpload } from '@components/file/file-upload';
import { authService, performerService } from '@services/index';
import { Button, Form } from 'antd';
import { PureComponent } from 'react';
import { IPerformerUpdate } from 'src/interfaces';

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};

interface IProps {
  onUploaded: Function;
  performer?: IPerformerUpdate;
  onFormRefSubmit?: Function;
  submiting?: boolean;
  update?: boolean;
}
export class PerformerDocument extends PureComponent<IProps> {
  state = {
    idVerificationUrl:
      this.props.performer && this.props.performer.idVerification
        ? this.props.performer.idVerification.url
        : '',
    documentVerificationUrl:
      this.props.performer && this.props.performer.documentVerification
        ? this.props.performer.documentVerification.url
        : '',
    releaseFormUrl:
      this.props.performer && this.props.performer.releaseForm
        ? this.props.performer.releaseForm.url
        : ''
  };

  render() {
    const {
      onUploaded, onFormRefSubmit, submiting, update
    } = this.props;
    const {
      idVerificationUrl,
      documentVerificationUrl,
      releaseFormUrl
    } = this.state;
    const uploadHeaders = {
      authorization: authService.getToken()
    };

    return (
      <Form
        {...layout}
        name="form-performer"
        onFinish={() => onFormRefSubmit()}
        initialValues={{}}
      >
        <div
          key="verificationId"
          className="ant-row ant-form-item ant-form-item-with-help"
        >
          {/* <div className="ant-col ant-col-lg-8 ant-col-md-10  ant-col-sm-12 ant-form-item-label"> */}
          <div className={update === true ? 'ant-col ant-col-lg-10 ant-col-md-10  ant-col-sm-12 ant-form-item-label' : 'ant-col ant-col-lg-8 ant-col-md-10  ant-col-sm-12 ant-form-item-label'}>
            <label>ID For Verification</label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            <FileUpload
              uploadUrl={performerService.getUploadDocumentUrl()}
              headers={uploadHeaders}
              onUploaded={(resp) => {
                this.setState({ idVerificationUrl: resp.response.data.url });
                onUploaded('idVerificationId', resp);
              }}
            />
            {idVerificationUrl && (
              <a target="_blank" href={idVerificationUrl} rel="noreferrer">ID For Verification Link </a>
            )}
          </div>
        </div>
        <div
          key="documentVerificationId"
          className="ant-row ant-form-item ant-form-item-with-help"
        >
          <div className={update === true ? 'ant-col ant-col-lg-10 ant-col-md-10  ant-col-sm-12 ant-form-item-label' : 'ant-col ant-col-lg-8 ant-col-md-10  ant-col-sm-12 ant-form-item-label'}>
            <label>Document For Verification</label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            <FileUpload
              uploadUrl={performerService.getUploadDocumentUrl()}
              headers={uploadHeaders}
              onUploaded={(resp) => {
                this.setState({
                  documentVerificationUrl: resp.response.data.url
                });
                onUploaded('documentVerificationId', resp);
              }}
            />
            {documentVerificationUrl && (
              <a target="_blank" href={documentVerificationUrl} rel="noreferrer">Document For Verification</a>
            )}
          </div>
        </div>
        <div
          key="releaseForm"
          className="ant-row ant-form-item ant-form-item-with-help"
        >
          <div className={update === true ? 'ant-col ant-col-lg-10 ant-col-md-10  ant-col-sm-12 ant-form-item-label' : 'ant-col ant-col-lg-8 ant-col-md-10  ant-col-sm-12 ant-form-item-label'}>
            <label>Release Form</label>
          </div>
          <div className="ant-col ant-col-16 ant-form-item-control">
            <FileUpload
              uploadUrl={performerService.getUploadDocumentUrl()}
              headers={uploadHeaders}
              onUploaded={(resp) => {
                this.setState({ releaseFormUrl: resp.response.data.url });
                onUploaded('releaseFormId', resp);
              }}
            />
            {releaseFormUrl && <a target="_blank" href={releaseFormUrl} rel="noreferrer">Release Form</a>}
          </div>
        </div>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
