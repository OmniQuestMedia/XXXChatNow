import { getResponseError } from '@lib/utils';
import { postService } from '@services/post.service';
import { settingService } from '@services/setting.service';
// import './index.less';
import {
  Button, Divider, Form, Input, message
} from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const Page = dynamic(() => import('@components/common/layout/page'));
const FormRegisterPlaceHolder = dynamic(() => import('@components/common/layout').then((res) => res.FormRegisterPlaceHolder));

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [contactFormContent, setContactFormContent] = useState('');

  const placeholderLoginUrl = useSelector((state: any) => state.ui.placeholderLoginUrl);

  const loadSettings = async () => {
    const res = await settingService.valueByKeys(['contactFormText']);
    setContactFormContent(res.data.contactFormText);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onFinish = async (data) => {
    try {
      setLoading(true);
      await postService.createContactContent(data);
      message.success('Email have been sent to a admin');
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className={style['contact-page']} inner>
      <PageTitle title="Contact us" />
      <div className="form-contact-container">
        <Form onFinish={onFinish.bind(this)}>
          <span className="form-contact-title">Contact</span>
          <br />
          <div className="sun-editor-editable" dangerouslySetInnerHTML={{ __html: contactFormContent }} />
          <Divider />
          <Form.Item name="subject">
            <Input placeholder="Subject" />
          </Form.Item>
          <Form.Item name="name">
            <Input placeholder="Your valid name" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { type: 'email', message: 'The input is not valid E-mail!' },
              { required: true, message: 'Please input your email!' }
            ]}
          >
            <Input placeholder="Your valid email" />
          </Form.Item>
          <Form.Item name="message">
            <Input.TextArea placeholder="Your message" rows={3} />
          </Form.Item>
          <Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              loading={loading}
              disabled={loading}
              block
            >
              Send
            </Button>
          </Form.Item>
        </Form>
      </div>
      <FormRegisterPlaceHolder placeholderLoginUrl={placeholderLoginUrl} />
    </Page>
  );
}

export default ContactPage;
