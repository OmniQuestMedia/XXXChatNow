import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { FormGallery } from '@components/gallery/form-gallery';
import { galleryService } from '@services/gallery.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';

class GalleryCreate extends PureComponent {
  state = {
    submitting: false
  };

  async submit(data: any) {
    try {
      this.setState({ submitting: true });
      const submitData = {
        ...data
      };
      await galleryService.create(submitData);
      message.success('Created successfully');
      Router.push('/gallery');
    } catch (e) {
      // TODO - check and show error here
      message.error('Something went wrong, please try again!');
      this.setState({ submitting: false });
    }
  }

  render() {
    return (
      <>
        <Head>
          <title>Create new gallery</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Galleries', href: '/gallery' },
            { title: 'Create new gallery' }
          ]}
        />
        <Page>
          <FormGallery
            onFinish={this.submit.bind(this)}
            submitting={this.state.submitting}
          />
        </Page>
      </>
    );
  }
}

export default GalleryCreate;
