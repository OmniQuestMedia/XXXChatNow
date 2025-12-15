import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { FormProduct } from '@components/product/form-product';
import { productService } from '@services/product.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';

interface IFiles {
  fieldname: string;
  file: File;
}

interface IResponse {
  data: { _id: string };
}
class CreateProduct extends PureComponent {
  state = {
    uploading: false,
    uploadPercentage: 0
  };

  _files: {
    image: File;
    digitalFile: File;
  } = {
      image: null,
      digitalFile: null
    };

  onUploading(resp: any) {
    this.setState({ uploadPercentage: resp.percentage });
  }

  beforeUpload(file: File, field: string) {
    this._files[field] = file;
  }

  async submit(data: any) {
    if (data.type === 'digital' && !this._files.digitalFile) {
      message.error('Please select digital file!');
      return;
    } if (data.type === 'physical') {
      this._files.digitalFile = null;
    }

    const files = Object.keys(this._files).reduce((mfiles, key) => {
      if (this._files[key]) {
        mfiles.push({
          fieldname: key,
          file: this._files[key] || null
        });
      }
      return mfiles;
    }, [] as IFiles[]) as [IFiles];

    this.setState({
      uploading: true
    });
    try {
      const resp = (await productService.createProduct(
        files,
        data,
        this.onUploading.bind(this)
      )) as IResponse;
      message.success('Product has been created');
      // TODO - process for response data?
      this.setState(
        {
          uploading: false
        },
        () => window.setTimeout(() => {
          Router.push(
            {
              pathname: '/product/update',
              query: {
                id: resp.data._id
              }
            },
            `/product/update?id=${resp.data._id}`,
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
    const { uploading, uploadPercentage } = this.state;
    return (
      <>
        <Head>
          <title>Create product</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Product', href: '/product' },
            { title: 'Create new product' }
          ]}
        />
        <Page>
          <FormProduct
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

export default CreateProduct;
