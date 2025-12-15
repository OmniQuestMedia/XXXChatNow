import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { performerCategoryService } from '@services/perfomer-category.service';
import {
  Button, Form, Input, InputNumber, message
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';

interface IFormValue {
  name: string;
  slug: string;
  ordering: number;
  description: string;
}
class CategoryUpdate extends PureComponent<any> {
  state = {
    submitting: false,
    category: null
  };

  static async getInitialProps(ctx) {
    return ctx.query;
  }

  async componentDidMount() {
    try {
      const resp = await performerCategoryService.findById(this.props.id);
      this.setState({ category: resp.data });
    } catch (e) {
      message.error('Category not found!');
    }
  }

  async submit(data: any) {
    try {
      this.setState({ submitting: true });

      const submitData = {
        ...data
      };
      await performerCategoryService.update(this.props.id, submitData);
      message.success('Updated successfully');
      this.setState({ submitting: false });
    } catch (e) {
      // TODO - check and show error here
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
      this.setState({ submitting: false });
    }
  }

  render() {
    const { category } = this.state;
    return (
      <>
        <Head>
          <title>Update category</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Performer categories', href: '/performer/category' },
            { title: 'Update' }
          ]}
        />

        <Page>
          {!category ? (
            <Loader />
          ) : (
            <Form
              onFinish={this.submit.bind(this)}
              initialValues={category as IFormValue}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please input name!' }]}
                label="Name"
              >
                <Input placeholder="Enter category name" />
              </Form.Item>

              <Form.Item name="slug" label="Slug">
                <Input placeholder="Custom friendly slug" />
              </Form.Item>

              <Form.Item name="ordering" label="Ordering">
                <InputNumber />
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item
                name="metaTitle"
                label="Meta title"
                help="Meta title will overwrite default title in user end if provided"
              >
                <Input placeholder="Enter custom meta title" />
              </Form.Item>
              <Form.Item
                name="metaDescription"
                label="Meta description"
                help="Meta description will overwrite default description in user end if provided. Meta description should be max 170 characters"
              >
                <Input.TextArea placeholder="Enter custom meta description" />
              </Form.Item>
              <Form.Item
                name="metaKeyword"
                label="Meta keyword"
                help="Meta keywords"
              >
                <Input placeholder="Enter custom meta keywords" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ float: 'right' }}
                loading={this.state.submitting}
              >
                Submit
              </Button>
            </Form>
          )}
        </Page>
      </>
    );
  }
}

export default CategoryUpdate;
