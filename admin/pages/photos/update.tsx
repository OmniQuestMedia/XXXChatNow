import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { FormUploadPhoto } from '@components/photo/form-upload-photo';
import { photoService } from '@services/photo.service';
import { message } from 'antd';
import Head from 'next/head';
import { Fragment, PureComponent } from 'react';
import { IPhotoUpdate } from 'src/interfaces';

interface IProps {
  id: string;
}
class PhotoUpdate extends PureComponent<IProps> {
  state = {
    submitting: false,
    fetching: true,
    photo: {} as IPhotoUpdate
  };

  static async getInitialProps(ctx) {
    return ctx.query;
  }

  async componentDidMount() {
    try {
      const resp = await photoService.findById(this.props.id);
      this.setState({ photo: resp.data });
    } catch (e) {
      message.error('Photo not found!');
    } finally {
      this.setState({ fetching: false });
    }
  }

  async submit(data: any) {
    try {
      this.setState({ submitting: true });

      const submitData = {
        ...data
      };
      await photoService.update(this.props.id, submitData);
      message.success('Updated successfully');
      this.setState({ submitting: false });
    } catch (e) {
      // TODO - check and show error here
      message.error('Something went wrong, please try again!');
      this.setState({ submitting: false });
    }
  }

  render() {
    const { photo, submitting, fetching } = this.state;
    return (
      <>
        <Head>
          <title>Update Photo</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Photos', href: '/photos' },
            { title: photo.title ? photo.title : 'Detail photo' },
            { title: 'Update' }
          ]}
        />
        <Page>
          {fetching ? (
            <Loader />
          ) : (
            <FormUploadPhoto
              photo={photo}
              submit={this.submit.bind(this)}
              uploading={submitting}
            />
          )}
        </Page>
      </>
    );
  }
}

export default PhotoUpdate;
