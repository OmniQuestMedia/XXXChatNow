import { FormUploadBanner } from '@components/banner/form-upload-banner';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { bannerService } from '@services/banner.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { createRef, PureComponent } from 'react';

interface IResponse {
  data: { _id: string };
}

interface IProps { }

class UploadBanner extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    uploading: false,
    uploadPercentage: 0
  };

  formRef: any;

  _banner: File;

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
  }

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  // setFormVal(field: string, val: any) {
  //   const instance = this.formRef.current as FormInstance;
  //   instance.setFieldsValue({
  //     [field]: val
  //   });
  // }

  beforeUpload(file) {
    this._banner = file;
    return false;
  }

  async submit(data: any) {
    if (data.type === 'img' && !this._banner) {
      message.error('Please select banner!');
      return;
    }

    this.setState({
      uploading: true
    });

    try {
      if (data.type === 'img') {
        (await bannerService.uploadBanner(this._banner, data, this.onUploading.bind(this))) as IResponse;
      } else if (data.type === 'html') {
        await bannerService.create(data);
      }
      message.success('Banner has been uploaded');
      this.setState(
        {
          uploading: false
        },
        () => window.setTimeout(() => {
          Router.push(
            {
              pathname: '/banner'
            },
            '/banner'
          );
        }, 1000)
      );
    } catch (error) {
      message.error('An error occurred, please try again!');
      this.setState({
        uploading: false
      });
    }
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { uploading, uploadPercentage } = this.state;
    return (
      <>
        <Head>
          <title>Upload banner</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Banners', href: '/banner' }, { title: 'Upload new banner' }]} />
        <Page>
          <FormUploadBanner
            submit={this.submit.bind(this)}
            beforeUpload={this.beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={uploadPercentage}
          />
        </Page>
      </>
    );
  }
}

export default UploadBanner;
