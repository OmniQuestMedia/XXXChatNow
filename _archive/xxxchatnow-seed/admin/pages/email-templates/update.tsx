import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { emailTemplateService } from '@services/email-template.service';
import {
  Button, Form, Input, message,
  Select,
  Switch
} from 'antd';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { PureComponent } from 'react';

const WYSIWYG = dynamic(() => import('@components/wysiwyg'), {
  ssr: false
});
class EmailTemplateUpdate extends PureComponent<any, any> {
  private _content: string = '';

  state = {
    submitting: false,
    fetching: true,
    template: null,
    isTextArea: true,
    content: ''
  };

  static async getInitialProps(ctx) {
    const { query } = ctx;
    return query;
  }

  async componentDidMount() {
    try {
      const { id } = this.props;
      const resp = await emailTemplateService.findById(id);
      this._content = resp.data.content;
      this.setState({ template: resp.data, content: this._content });
    } catch (e) {
      message.error('Email template not found!');
    } finally {
      this.setState({ fetching: false });
    }
  }

  async submit(data: any) {
    try {
      this.setState({ submitting: true });
      const { id } = this.props;

      const submitData = {
        ...data,
        content: this._content
      };
      await emailTemplateService.update(id, submitData);
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
    this.setState({ content });
  }

  render() {
    const {
      template, fetching, submitting, isTextArea, content
    } = this.state;
    return (
      <>
        <Head>
          <title>Update template</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Email templates', href: '/email-templates' },
            { title: 'Update template' }
          ]}
        />
        <Page>
          {!template || fetching ? (
            <Loader />
          ) : (
            <Form
              onFinish={this.submit.bind(this)}
              initialValues={template}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Form.Item
                name="subject"
                rules={[{ required: true, message: 'Please enter subject!' }]}
                label="Subject"
              >
                <Input placeholder="Enter your title" />
              </Form.Item>

              <Form.Item
                label="Content"
                help={template?.description}
              >
                {!isTextArea ? (
                  <WYSIWYG
                    onChange={this.contentChange.bind(this)}
                    html={this._content}
                  />
                ) : (
                  <Input.TextArea
                    style={{ width: '100%' }}
                    onChange={(e) => {
                      this._content = e.target.value;
                      this.setState({
                        content: e.target.value
                      });
                    }}
                    rows={5}
                    autoFocus
                    value={content}
                  />
                )}
              </Form.Item>
              <Form.Item
                label="Editor"
                help="WYSIWYG Editor will overwrite in some templates which have special coding structure. Please recheck HTML source code after change and update accordingly after used WYSIWYG Editor to update"
              >
                <Switch
                  checkedChildren="WYSIWYG Editor"
                  unCheckedChildren="HTML textarea"
                  onChange={() => this.setState({ isTextArea: !isTextArea })}
                />
              </Form.Item>
              <Form.Item
                name="layout"
                label="Layout"
                rules={[{ required: true, message: 'Please select template layout' }]}
              >
                <Select>
                  <Select.Option value="layouts/default">Default</Select.Option>
                  <Select.Option value="blank">Blank</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 4 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ float: 'right' }}
                  loading={submitting}
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

export default EmailTemplateUpdate;
