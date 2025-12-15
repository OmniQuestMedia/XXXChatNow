import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { FormGallery } from '@components/gallery/form-gallery';
import { galleryService } from '@services/gallery.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { Fragment, PureComponent } from 'react';
import { IGalleryUpdate } from 'src/interfaces';

interface IProps {
  id: string;
}
class GalleryUpdate extends PureComponent<IProps> {
  state = {
    submitting: false,
    fetching: true,
    gallery: {} as IGalleryUpdate
  };

  static async getInitialProps(ctx) {
    return ctx.query;
  }

  async componentDidMount() {
    try {
      const resp = await galleryService.findById(this.props.id);
      this.setState({ gallery: resp.data });
    } catch (e) {
      message.error('Gallery not found!');
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
      await galleryService.update(this.props.id, submitData);
      message.success('Updated successfully');
      this.setState({ submitting: false });
    } catch (e) {
      // TODO - check and show error here
      message.error('Something went wrong, please try again!');
      this.setState({ submitting: false });
    }
    Router.push('/gallery');
  }

  render() {
    const { gallery, submitting, fetching } = this.state;
    return (
      <>
        <Head>
          <title>Update Gallery</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Gallery', href: '/gallery' },
            { title: gallery.name ? gallery.name : 'Detail gallery' }
          ]}
        />
        <Page>
          {fetching ? (
            <Loader />
          ) : (
            <FormGallery
              gallery={gallery}
              onFinish={this.submit.bind(this)}
              submitting={submitting}
            />
          )}
        </Page>
      </>
    );
  }
}

export default GalleryUpdate;
