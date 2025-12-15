import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { pushNotificationService } from '@services/push-notification';
import {
  Button, Form, Input, message
} from 'antd';
import Head from 'next/head';

export default function PushNotificationPage() {
  const onFinish = async (values: any) => {
    try {
      await pushNotificationService.send(values);
      message.success('Success');
    } catch {
      message.error('Bad Request');
    }
  };

  return (
    <>
      <Head>
        <title>Notification</title>
      </Head>
      <Page>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Push Notification' }
          ]}
        />
        <div>
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item label="Title" name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Message" name="message" rules={[{ required: true }]}>
              <Input.TextArea rows={6} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Send</Button>
            </Form.Item>
          </Form>
        </div>
      </Page>
    </>
  );
}
