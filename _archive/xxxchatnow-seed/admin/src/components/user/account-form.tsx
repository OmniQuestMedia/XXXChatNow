import { QuestionCircleOutlined } from '@ant-design/icons';
import { AvatarUpload } from '@components/user/avatar-upload';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tooltip
} from 'antd';
import moment from 'moment';
import getConfig from 'next/config';
import { ICountry, IUser } from 'src/interfaces';

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  },
  number: {
    // eslint-disable-next-line
    range: 'Must be between ${min} and ${max}'
  }
};

interface IProps {
  onFinish: Function;
  user?: IUser;
  updating?: boolean;
  options?: {
    uploadHeaders?: any;
    avatarUploadUrl?: string;
    onAvatarUploaded?: Function;
    beforeUpload?: Function;
  };
  countries: ICountry[];
}

export function AccountForm({
  user = null,
  updating = false,
  options = {},
  countries,
  onFinish
}: IProps) {
  const {
    uploadHeaders = null,
    avatarUploadUrl = '',
    onAvatarUploaded = () => {},
    beforeUpload = () => {}
  } = options;
  const { publicRuntimeConfig: config } = getConfig();
  return (
    <Form
      {...layout}
      name="nest-messages"
      onFinish={onFinish.bind(this)}
      validateMessages={validateMessages}
      initialValues={
        user
          ? { ...user, dateOfBirth: moment(user.dateOfBirth) }
          : {
            country: 'US',
            status: 'active',
            gender: 'male',
            roles: ['user']
          }
      }
    >
      <Form.Item
        name="firstName"
        label="First name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="lastName"
        label="Last name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="dateOfBirth"
        label="Date of Birth"
        rules={[
          {
            required: true,
            message: 'Please input date of birth!'
          },
          {
            validator: (_rule, value) => {
              if (!value) return Promise.resolve();
              const years = moment().diff(value, 'years');
              if (years >= 18) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Minimum of 18 years'));
            }
          }
        ]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
        <Select>
          <Select.Option key="male" value="male">
            Male
          </Select.Option>
          <Select.Option key="female" value="female">
            Female
          </Select.Option>
          <Select.Option key="transgender" value="transgender">
            Transgender
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="phone"
        label="Phone Number"
        rules={[
          { min: 9 },
          { max: 14 },
          {
            pattern: /^[0-9\b+ ]+$/,
            message: 'The phone number is not in the correct format'
          }
        ]}
      >
        <Input style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="username"
        label="Username"
        rules={[{ required: true }, { min: 3 }]}
      >
        <Input placeholder="Unique, lowercase and number, no space or special chars" />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: 'email', required: true }]}
      >
        <Input />
      </Form.Item>
      {!user && (
        <>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true }, { min: 6 }]}
          >
            <Input.Password placeholder="User password" />
          </Form.Item>
          <Form.Item
            name="rePassword"
            label="Confirm password"
            rules={[{ required: true }, { min: 6 }]}
          >
            <Input.Password placeholder="Confirm user password" />
          </Form.Item>
        </>
      )}
      <Form.Item name="country" label="Country" rules={[{ required: true }]}>
        <Select
          showSearch
          filterOption={(input, option: any) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
        >
          {countries.map((country) => (
            <Select.Option key={country.code} value={country.code}>
              {country.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <>
        <Form.Item name="balance" label="Balance">
          <InputNumber />
        </Form.Item>
        <Form.Item name="roles" label="Roles" rules={[{ required: true }]}>
          <Select mode="multiple">
            <Select.Option key="user" value="user">
              User
            </Select.Option>
            <Select.Option key="admin" value="admin">
              Admin
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="emailVerified"
          label="Verified Email"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </>
      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select>
          <Select.Option key="active" value="active">
            Active
          </Select.Option>
          <Select.Option key="inactive" value="inactive">
            Inactive
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="enableGhostMode"
        label={(
          <>
            Ghost Mode
            &nbsp;
            <Tooltip title="In ghost mode, your display name will be 'Anonymous'"><QuestionCircleOutlined /></Tooltip>
          </>
            )}
        valuePropName="checked"
      >
        <Switch checkedChildren="On" unCheckedChildren="Off" />
      </Form.Item>
      <Form.Item
        label="Avatar"
        help={`Image must smaller than ${config.MAX_SIZE_IMAGE || 2
        }MB!`}
      >
        {/* <Avatar alt="Avatar" /> */}
        <AvatarUpload
          headers={uploadHeaders}
          uploadUrl={avatarUploadUrl}
          onUploaded={onAvatarUploaded}
          imageUrl={user ? user.avatar : ''}
          uploadNow={!!user}
          beforeUpload={beforeUpload}
        />
      </Form.Item>
      <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
        <Button type="primary" htmlType="submit" loading={updating}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
