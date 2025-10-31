import {
  Button, Form, Input, message
} from 'antd';
import { PureComponent } from 'react';

const layout = {
  labelCol: { lg: { span: 4 }, sm: { span: 6 } },
  wrapperCol: { lg: { span: 20 }, sm: { span: 18 } }
};

interface IProps {
  onFinish: Function;
  socials?: any;
  submiting?: boolean;
}

export class SocialsForm extends PureComponent<IProps> {
  render() {
    const {
      socials,
      onFinish,
      submiting
    } = this.props;
    return (
      <Form
        {...layout}
        name="form-performer"
        onFinish={(values) => {
          onFinish({ socials: values });
        }}
        onFinishFailed={() => message.error(
          'Please complete the required fields'
        )}
        initialValues={
          socials || ({
            facebook: 'facebook.com',
            twitter: 'twitter.com',
            instagram: 'instagram.com'
          })
        }
      >
        <Form.Item name="facebook" label="Facebook">
          <Input placeholder={socials?.facebook || ''} />
        </Form.Item>
        <Form.Item name="twitter" label="Twitter">
          <Input placeholder={socials?.twitter || ''} />
        </Form.Item>
        <Form.Item name="instagram" label="Instagram">
          <Input placeholder={socials?.instagram || ''} />
        </Form.Item>
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
