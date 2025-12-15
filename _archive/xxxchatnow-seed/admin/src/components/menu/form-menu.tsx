import { QuestionCircleOutlined } from '@ant-design/icons';
import { SelectPostDropdown } from '@components/post/select-post-dropdown';
import { isUrl } from '@lib/string';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Popover,
  Select,
  Switch
} from 'antd';
import { FormInstance } from 'antd/lib/form';
import Link from 'next/link';
import { createRef, PureComponent } from 'react';
import { IMenuCreate, IMenuUpdate } from 'src/interfaces';

import { SelectMenuTreeDropdown } from './common/menu-tree.select';

interface IProps {
  menu?: IMenuUpdate;
  onFinish: Function;
  submitting?: boolean;
}
export class FormMenu extends PureComponent<IProps> {
  formRef: any;

  state = {
    isInternal: false
  };

  componentDidMount() {
    if (!this.formRef) this.formRef = createRef();
    const { menu } = this.props;
    if (menu) {
      this.setState({
        isInternal: menu.internal
      });
    }
  }

  handleSubmit(data) {
    const { path, internal } = data;
    const { onFinish } = this.props;
    if (internal && !isUrl(path)) {
      // eslint-disable-next-line
      data.path = path;
    }
    onFinish(data);
  }

  setFormVal(field: string, val: any) {
    const instance = this.formRef.current as FormInstance;
    instance.setFieldsValue({
      [field]: val
    });
  }

  render() {
    if (!this.formRef) this.formRef = createRef();
    const { menu, submitting } = this.props;
    const { isInternal } = this.state;
    return (
      <Form
        ref={this.formRef}
        onFinish={this.handleSubmit.bind(this)}
        initialValues={
          menu || ({
            title: '',
            path: '',
            help: '',
            public: false,
            internal: false,
            parentId: null,
            section: 'footer',
            ordering: 1,
            isOpenNewTab: false
          } as IMenuCreate)
        }
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
      >
        <Form.Item
          name="internal"
          label={(
            <>
              <Popover
                content={(
                  <p>
                    Using system website Static Page as menu item or external
                    link
                  </p>
                )}
              >
                <a style={{ marginRight: '5px' }}>
                  <QuestionCircleOutlined />
                </a>
              </Popover>
              From sytem page?
            </>
          )}
          valuePropName="checked"
        >
          <Switch
            defaultChecked={false}
            onChange={(val) => {
              this.setState({ isInternal: val });
              this.setFormVal('path', '');
            }}
          />
        </Form.Item>
        {!isInternal
          && (
          <Form.Item
            name="isOpenNewTab"
            label="Is open in new tab?"
            valuePropName="checked"
          >
            <Switch defaultChecked={false} />
          </Form.Item>
          )}
        {isInternal ? (
          <Form.Item
            name="path"
            rules={[
              { required: true, message: 'Please select a page!' }
            ]}
            label={(
              <>
                <Popover
                  content={(
                    <p>
                      If there is no data, please create a page at
                      {' '}
                      <Link href="/posts/create">
                        <a>here</a>
                      </Link>
                    </p>
                  )}
                  title="Pages listing"
                >
                  <a style={{ marginRight: '5px' }}>
                    <QuestionCircleOutlined />
                  </a>
                </Popover>
                Page
              </>
            )}
          >
            <SelectPostDropdown onSelect={(_, data) => {
              const { slug } = data;
              this.setFormVal('path', `/page/${slug}`);
            }}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="path"
            rules={[
              { required: true, message: 'Please input url of menu!' },
              {
                validator: (rule, value) => {
                  if (!value) return Promise.resolve();
                  const isUrlValid = isUrl(value);
                  if (!isUrlValid) {
                    return Promise.reject(new Error('The url is not valid'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            label="Url"
          >
            <Input placeholder="Enter menu url" />
          </Form.Item>
        )}
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'Please input title of menu!' }]}
          label="Title"
        >
          <Input placeholder="Enter menu title" />
        </Form.Item>
        <Form.Item
          name="section"
          label="Section"
          rules={[{ required: true, message: 'Please select menu section!' }]}
        >
          <Select disabled>
            <Select.Option key="main" value="main">
              Main
            </Select.Option>
            <Select.Option key="header" value="header">
              Header
            </Select.Option>
            <Select.Option key="footer" value="footer">
              Footer
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="parentId" label="Parent">
          <SelectMenuTreeDropdown
            onSelect={(val) => this.setFormVal('parentId', val)}
            menu={menu || null}
          />
        </Form.Item>
        <Form.Item name="ordering" label="Ordering">
          <InputNumber
            type="number"
            min={1}
            placeholder="Enter ordering of menu item"
          />
        </Form.Item>
        <Form.Item wrapperCol={{ span: 20, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
