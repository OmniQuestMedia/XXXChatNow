import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { FormUploadPhoto } from '@components/photo/form-upload-photo';
import { photoService } from '@services/photo.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';

interface IResponse {
  data: { _id: string };
}

interface IProps {
  galleryId: string;
  performerId: string;
}

class UploadPhoto extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    uploading: false,
    uploadPercentage: 0
  };

  _photo: File;

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file) {
    const reader = new FileReader();
    // reader.addEventListener('load', () => this.setState({
    //   preview: reader.result
    // }));
    reader.readAsDataURL(file);

    this._photo = file;
    return false;
  }

  async submit(data: any) {
    if (!this._photo) {
      message.error('Please select photo!');
      return;
    }

    this.setState({
      uploading: true
    });
    try {
      const resp = (await photoService.uploadPhoto(
        this._photo,
        data,
        this.onUploading.bind(this)
      )) as IResponse;
      message.success('Photo has been uploaded');
      // TODO - process for response data?
      this.setState(
        {
          uploading: false
        },
        () => window.setTimeout(() => {
          Router.push(
            {
              pathname: '/photos/update',
              query: {
                id: resp.data._id
              }
            },
            `/photos/update?id=${resp.data._id}`,
            {
              shallow: true
            }
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
    const { uploading } = this.state;
    return (
      <>
        <Head>
          <title>Upload photo</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Photos', href: '/photos' },
            { title: 'Upload new photo' }
          ]}
        />
        <Page>
          <FormUploadPhoto
            submit={this.submit.bind(this)}
            beforeUpload={this.beforeUpload.bind(this)}
            uploading={uploading}
            uploadPercentage={this.state.uploadPercentage}
            galleryId={this.props.galleryId || ''}
            performerId={this.props.performerId || ''}
          />
        </Page>
      </>
    );
  }
}

export default UploadPhoto;
