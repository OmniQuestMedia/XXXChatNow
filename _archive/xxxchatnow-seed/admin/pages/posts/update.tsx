import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { postService } from '@services/post.service';
import {
  Button, Form, Input, message, Select
} from 'antd';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { PureComponent } from 'react';

const WYSIWYG = dynamic(() => import('@components/wysiwyg'), {
  ssr: false
});
class PostUpdate extends PureComponent<any> {
  private _content: string = '';

  state = {
    submitting: false,
    post: null
  };

  static async getInitialProps(ctx) {
    const { query } = ctx;
    if (!query.type) {
      query.type = 'post';
    }
    return query;
  }

  async componentDidMount() {
    try {
      const resp = await postService.findById(this.props.id);
      this._content = resp.data.content;
      this.setState({ post: resp.data });
    } catch (e) {
      message.error('Post not found!');
    }
  }

  async submit(data: any) {
    try {
      this.setState({ submitting: true });

      const submitData = {
        ...data,
        content: this._content
      };
      await postService.update(this.props.id, submitData);
      message.success('Updated successfully');
      this.setState({ submitting: false });
    } catch (e) {
      // TODO - check and show error here
      message.error('Something went wrong, please try again!');
      this.setState({ submitting: false });
    }
  }

  contentChange(content: string) {
    this._content = content;
  }

  render() {
    const { post } = this.state;
    return (
      <>
        <Head>
          <title>Update post</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Static pages', href: '/posts' }, { title: 'Update post' }]} />

        <Page>
          {!post ? (
            <Loader />
          ) : (
            <Form
              onFinish={this.submit.bind(this)}
              initialValues={post}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Form.Item
                name="title"
                rules={[{ required: true, message: 'Please input title!' }]}
                label="Title"
              >
                <Input placeholder="Enter your title" />
              </Form.Item>

              <Form.Item name="slug" label="Slug">
                <Input placeholder="Custom friendly slug" />
              </Form.Item>

              <Form.Item name="shortDescription" label="Short description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Content">
                <WYSIWYG
                  onChange={this.contentChange.bind(this)}
                  html={this._content}
                />
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
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="published">Publish</Select.Option>
                  <Select.Option value="draft">Draft</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 4 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ float: 'right' }}
                  loading={this.state.submitting}
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
          )}
        </Page>
      </>
    );
  }
}

export default PostUpdate;
