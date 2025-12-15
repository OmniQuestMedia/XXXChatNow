import { BreadcrumbComponent } from '@components/common';
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-duplicate-case */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { ColorPicker } from '@components/common/base/color-picker';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { ImageUpload } from '@components/file/image-upload';
import SoundUpload from '@components/file/sound-upload';
import { SelectPostDropdown } from '@components/post/select-post-dropdown';
import { capitalizeFirstLetter, generateUuid } from '@lib/string';
import { getResponseError } from '@lib/utils';
import { authService } from '@services/auth.service';
import { settingService } from '@services/setting.service';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Radio,
  Row,
  Select,
  Space,
  Switch
} from 'antd';
import { FormInstance } from 'antd/lib/form';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { createRef, PureComponent, RefObject } from 'react';
import { ISetting } from 'src/interfaces';

const WYSIWYG = dynamic(() => import('@components/wysiwyg'), {
  ssr: false
});

const { Option } = Select;

class Settings extends PureComponent {
  state = {
    updating: false,
    loading: false,
    selectedTab: 'general',
    list: [],
    disableButton: false
  };

  formRef: RefObject<FormInstance>;

  _key: 0;

  dataChange = {} as any;

  smtpInfo = {
    host: '',
    port: 465,
    secure: true,
    auth: {
      user: '',
      password: ''
    }
  } as any;

  componentDidMount() {
    this.formRef = createRef();
    this.loadSettings();
  }

  async onMenuChange(menu) {
    await this.setState({
      selectedTab: menu.key
    });

    await this.loadSettings();
  }

  setVal(field: string, val: any) {
    // Disable submit button if commission percentage is greater than 100 and and less than 0
    if (field === 'defaultCommission' || field === 'studioCommission') {
      if (val > 100 || val < 0) {
        this.setState({ disableButton: true });
      } else {
        this.setState({ disableButton: false });
      }
    }
    this.dataChange[field] = val;
    this.formRef.current.setFieldValue(field, val);
  }

  setObject(field: string, val: any) {
    if (field === 'user' || field === 'pass') {
      this.smtpInfo.auth[field] = val;
    } else {
      this.smtpInfo[field] = val;
    }
    this.dataChange.smtpTransporter = this.smtpInfo;
  }

  async loadSettings() {
    const { selectedTab } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = (await settingService.all(this.state.selectedTab)) as any;
      this.dataChange = {};
      if (selectedTab === 'mailer' && resp.data && resp.data.length) {
        const info = resp.data.find((data) => data.key === 'smtpTransporter');
        if (info) this.smtpInfo = info.value;
      }
      let settings = resp.data;
      if (selectedTab === 'camAggregator') {
        settings = settings.sort((a, b) => a.meta?.ordering > b.meta?.ordering);
      }
      this.setState({ list: settings });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      await this.setState({ loading: false });
    }
  }

  async submit() {
    try {
      this.setState({ updating: true });
      // eslint-disable-next-line
      for (const key of Object.keys(this.dataChange)) {
        // eslint-disable-next-line
        await settingService.update(key, this.dataChange[key]);
      }
      this.state.selectedTab === 'commission'
        ? message.success('Default commission setting saved')
        : message.success(
          `${capitalizeFirstLetter(this.state.selectedTab)} settings saved`
        );
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ updating: false });
    }
  }

  async addBadging(setting) {
    const uid = generateUuid();
    const newVal = [...(this.formRef.current.getFieldValue(setting.key) || []), {
      id: uid,
      color: '#ff0066',
      tokens: 15,
      ordering: 0
    }];
    this.setVal(setting.key, newVal);
    this._key += 1;
    this.formRef.current.setFieldsValue({ [setting.key]: newVal });
  }

  async deleteBadging(id, setting) {
    const curVal = this.formRef.current.getFieldValue(setting.key);
    const newVal = curVal.filter((t) => t.id !== id);
    this.setVal(setting.key, newVal);
    this._key -= 1;
    this.formRef.current.setFieldsValue({ [setting.key]: newVal });
  }

  async verifyMailer() {
    try {
      this.setState({ updating: true });
      const resp = await settingService.verifyMailer();
      const hasError = resp.data.hasError || resp.data.data?.hasError;
      if (hasError) {
        const error = resp.data.error || resp.data.data?.error;
        message.error(JSON.stringify(error || 'Could not verify this SMTP transporter'));
        return;
      }
      message.success(
        "We've sent and test email, please check your email inbox or spam folder"
      );
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(
        err && err.errno ? err.errno : 'Could not verify this SMTP transporter'
      );
    } finally {
      this.setState({ updating: false });
    }
  }

  renderUpload(setting: ISetting, ref: any) {
    if (!setting.meta || !setting.meta.upload) {
      return null;
    }
    const uploadHeaders = {
      authorization: authService.getToken()
    };
    return (
      <div style={{ padding: '10px 0' }} key={`upload${setting._id}`}>
        {setting.meta.image ? (
          <ImageUpload
            imageUrl={setting.value}
            uploadUrl={settingService.getFileUploadUrl()}
            headers={uploadHeaders}
            onUploaded={(resp) => {
              const formInstance = this.formRef.current as FormInstance;
              // eslint-disable-next-line
              ref.current.input.value = resp.response.data.url;
              formInstance.setFieldsValue({
                [setting.key]: resp.response.data.url
              });
              this.dataChange[setting.key] = resp.response.data.url;
            }}
          />
        ) : (
          <SoundUpload
            fileUrl={setting.value}
            uploadUrl={settingService.getFileUploadUrl()}
            headers={uploadHeaders}
            onUploaded={(resp) => {
              const formInstance = this.formRef.current as FormInstance;
              // eslint-disable-next-line
              ref.current.input.value = resp.response.data.url;
              formInstance.setFieldsValue({
                [setting.key]: resp.response.data.url
              });
              this.dataChange[setting.key] = resp.response.data.url;
            }}
          />
        )}
      </div>
    );
  }

  renderFormItem(setting: ISetting) {
    const { updating } = this.state;
    let { type } = setting;
    if (setting.meta && setting.meta.textarea) {
      type = 'textarea';
    }
    const ref = createRef() as any;

    switch (type) {
      case 'textarea':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            extra={setting.description}
          >
            <Input.TextArea
              defaultValue={setting.value}
              onChange={(val) => this.setVal(setting.key, val.target.value)}
            />
          </Form.Item>
        );
      case 'text-editor':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            help={setting.description}
          >
            <WYSIWYG
              onChange={(text) => this.setVal(setting.key, text)}
              html={setting.value}
            />
          </Form.Item>
        );
      case 'checkbox':
        return (
          <Form.Item label={setting.name} key={setting._id}>
            <Checkbox.Group
              options={setting.meta.options}
              onChange={(checkedValues) => this.setVal(setting.key, checkedValues)}
              defaultValue={setting.value}
            />
          </Form.Item>
        );
      case 'number':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            extra={setting.description}
            name={setting.key}
            rules={[
              {
                validator: (_, value) => {
                  if (typeof value !== 'number') {
                    return Promise.reject(new Error('This field must be a number!'));
                  }
                  if (
                    setting.meta
                    && typeof setting.meta.min !== 'undefined'
                    && value < setting.meta.min
                  ) {
                    return Promise.reject(new Error(`Minimum ${setting.meta.min}`));
                  }
                  if (
                    setting.meta
                    && typeof setting.meta.min !== 'undefined'
                    && value > setting.meta.max
                  ) {
                    return Promise.reject(new Error(`Maximum ${setting.meta.max}`));
                  }

                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              step={
                setting.meta && typeof setting.meta.step !== 'undefined'
                  ? setting.meta.step
                  : 1
              }
              defaultValue={setting.value}
              onChange={(val) => this.setVal(setting.key, val)}
              min={
                setting.meta && typeof setting.meta.min !== 'undefined'
                  ? setting.meta.min
                  : Number.MIN_SAFE_INTEGER
              }
              max={
                setting.meta && typeof setting.meta.max !== 'undefined'
                  ? setting.meta.max
                  : Number.MAX_SAFE_INTEGER
              }
              type="number"
            />
          </Form.Item>
        );
      case 'boolean':
        return (
          <div
            className="ant-row ant-form-item ant-form-item-with-help"
            key={setting._id}
          >
            <div className="ant-col ant-col-4 ant-form-item-label">
              <label>{setting.name}</label>
            </div>
            <div className="ant-col ant-col-16 ant-form-item-control">
              <Switch
                defaultChecked={setting.value}
                onChange={(val) => this.setVal(setting.key, val)}
              />
              <div className="ant-form-item-explain">{setting.description}</div>
            </div>
          </div>
        );
      case 'list':
        return (
          <>
            <div style={{ margin: '10px', overflow: 'auto' }}>
              <Space>
                <Button onClick={this.addBadging.bind(this, setting)} type="primary">Add Tier</Button>
              </Space>
            </div>
            <div style={{ margin: '10px' }}>
              <Form.Item shouldUpdate wrapperCol={{ span: 24 }}>
                {
                  () => {
                    const newValues = this.formRef.current?.getFieldValue(setting.key) || [];
                    const values = [...newValues];
                    const uploadHeaders = {
                      authorization: authService.getToken()
                    };
                    return (values && values.length > 0) ? values.map((arrItem) => (
                      <Row
                        style={{
                          padding: '20px', marginBottom: '10px', border: `1px solid ${arrItem.color}`, borderRadius: '10px'
                        }}
                        key={arrItem.id}
                      >
                        <Col md={2} sm={24}>
                          <span style={{ color: `${arrItem.color}`, fontWeight: 'bold' }}>
                            #
                          </span>
                          <InputNumber
                            style={{
                              color: `${arrItem.color}`,
                              border: `1px solid ${arrItem.color}`,
                              width: '100%'
                            }}
                            placeholder="#"
                            type="number"
                            min={0}
                            required
                            defaultValue={arrItem.ordering}
                            onChange={(e) => this.setVal(
                              setting.key,
                              (this.formRef.current.getFieldValue(setting.key) || []).map((t) => {
                                if (t.id === arrItem.id) {
                                  return {
                                    ...t,
                                    ordering: e
                                  };
                                }
                                return t;
                              })
                            )}
                          />
                        </Col>
                        <Col md={7} sm={24}>
                          <span style={{ color: `${arrItem.color}`, fontWeight: 'bold' }}>
                            Tier
                          </span>
                          <Input
                            style={{
                              color: `${arrItem.color}`,
                              border: `1px solid ${arrItem.color}`
                            }}
                            placeholder="Name"
                            min={0}
                            required
                            defaultValue={arrItem.name}
                            onChange={(e) => this.setVal(
                              setting.key,
                              (this.formRef.current.getFieldValue(setting.key) || []).map((t) => {
                                if (t.id === arrItem.id) {
                                  return {
                                    ...t,
                                    name: e.target.value
                                  };
                                }
                                return t;
                              })
                            )}
                          />
                        </Col>
                        <Col md={7} sm={24}>
                          <span style={{ color: `${arrItem.color}`, fontWeight: 'bold' }}>
                            Tokens
                          </span>
                          <InputNumber
                            style={{
                              color: `${arrItem.color}`,
                              border: `1px solid ${arrItem.color}`,
                              width: '100%'
                            }}
                            placeholder="Tokens"
                            type="number"
                            min={0}
                            required
                            defaultValue={arrItem.tokens}
                            onChange={(e) => this.setVal(
                              setting.key,
                              (this.formRef.current.getFieldValue(setting.key) || []).map((t) => {
                                if (t.id === arrItem.id) {
                                  return {
                                    ...t,
                                    tokens: e
                                  };
                                }
                                return t;
                              })
                            )}
                          />
                        </Col>
                        <Col md={4} sm={24}>
                          <span style={{ color: `${arrItem.color}`, fontWeight: 'bold' }}>Color</span>
                          <ColorPicker
                            defaultValue={arrItem.color}
                            onChange={(color) => this.setVal(
                              setting.key,
                              values.map((t) => {
                                if (t.id === arrItem.id) {
                                  return {
                                    ...t,
                                    color: color.hex
                                  };
                                }
                                return t;
                              })
                            )}
                          />
                        </Col>
                        <Col md={2} sm={24}>
                          <span style={{ color: `${arrItem.color}`, fontWeight: 'bold', display: 'flex' }}>Icon</span>
                          <ImageUpload
                            uploadUrl={settingService.getFileUploadUrl()}
                            headers={uploadHeaders}
                            imageUrl={arrItem.icon}
                            onUploaded={(resp) => {
                              this.setVal(
                                setting.key,
                                (this.formRef.current.getFieldValue(setting.key) || []).map((t) => {
                                  if (t.id === arrItem.id) {
                                    return {
                                      ...t,
                                      icon: resp.response.data.url
                                    };
                                  }
                                  return t;
                                })
                              );
                            }}
                          />
                        </Col>
                        <Col md={2} sm={24}>
                          <span style={{ color: `${arrItem.color}`, fontWeight: 'bold' }}>Action</span>
                          <Button
                            style={{ color: `${arrItem.color}`, border: `1px solid ${arrItem.color}`, width: '100%' }}
                            onClick={this.deleteBadging.bind(this, arrItem.id, setting)}
                          >
                            Delete
                          </Button>
                        </Col>
                      </Row>
                    )) : <p>Please add user badging</p>;
                  }
                }
              </Form.Item>
              <Form.Item name="ranks" hidden />
            </div>
          </>
        );
      case 'commission':
        return (
          <Form.Item
            name={setting.key}
            label={setting.name}
            key={setting._id}
            extra={setting.description}
            rules={[
              {
                validator(_, value) {
                  if (!value) return Promise.resolve();

                  if (typeof value === 'string') {
                    return Promise.reject(
                      new Error('Commission value should not be a alphabet')
                    );
                  }

                  if (!value || value > 100 || value < 0) {
                    return Promise.reject(
                      new Error('Commission value cannot be blank or greater than 100')
                    );
                  }
                  return Promise.resolve();
                }
              },
              {
                required: true,
                message: 'Commission value cannot be blank or greater than 100'
              }
            ]}
          >
            <InputNumber
              type="number"
              min={0}
              step={0.01}
              defaultValue={setting.value}
              onChange={(val) => this.setVal(setting.key, val)}
              required
            />
          </Form.Item>
        );
      case 'mixed':
        return (
          <div
            className="ant-row ant-form-item ant-form-item-with-help"
            key={setting._id}
          >
            <div className="ant-col ant-col-4 ant-form-item-label">
              <label htmlFor="setting-name">{setting.name}</label>
            </div>
            <div className="ant-col ant-col-20 ant-form-item-control">
              <div className="ant-form-item">
                <div>
                  <label htmlFor="host-name">Host</label>
                  <Input
                    defaultValue={setting?.value?.host}
                    onChange={(val) => this.setObject('host', val.target.value)}
                  />
                </div>
                <div>
                  <label>Port</label>
                  <Input
                    defaultValue={setting?.value?.port}
                    onChange={(val) => this.setObject('port', val.target.value)}
                  />
                </div>
                <div style={{ margin: '10px 0' }}>
                  <label>
                    <Checkbox
                      defaultChecked={setting?.value?.secure || false}
                      onChange={(e) => this.setObject('secure', e.target.checked)}
                    />
                    {' '}
                    Secure (true for port 465, false for other ports)
                  </label>
                </div>
                <div>
                  <label>Auth user</label>
                  <Input
                    defaultValue={setting?.value?.auth?.user}
                    onChange={(val) => this.setObject('user', val.target.value)}
                  />
                </div>
                <div>
                  <label>Auth password</label>
                  <Input
                    defaultValue={setting?.value?.auth?.pass}
                    onChange={(val) => this.setObject('pass', val.target.value)}
                  />
                </div>
              </div>
              <div className="ant-form-item-explain">{setting.description}</div>
              <div>
                <Button
                  disabled={updating}
                  loading={updating}
                  onClick={this.verifyMailer.bind(this)}
                  type="link"
                >
                  Once saved, click here to send a testing email using this
                  configuration above. An email will be send to Admin Email.
                </Button>
              </div>
            </div>
          </div>
        );
      case 'radio':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            help={setting.description}
            extra={setting.extra}
          >
            <Radio.Group
              onChange={(val) => this.setVal(setting.key, val.target.value)}
              defaultValue={setting.value}
            >
              {setting.meta?.value.map((v: any) => (
                <Radio
                  value={v.key}
                  checked={this.dataChange[setting.key] === v.key}
                >
                  {v.name}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        );
      case 'post':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            help={setting.description}
            extra={setting.extra}
          >
            <SelectPostDropdown
              defaultValue={setting.value}
              onSelect={(val) => this.setVal(setting.key, val)}
            />
          </Form.Item>
        );
      case 'dropdown':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            help={setting.description}
            extra={setting.extra}
          >
            <Select
              onChange={(val) => this.setVal(setting.key, val)}
              defaultValue={setting.value}
            >
              {setting.meta?.value.map((v: any) => (
                <Option value={v.key}>{v.name}</Option>
              ))}
            </Select>
          </Form.Item>
        );
      case 'password':
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            help={setting.description}
            extra={setting.extra}
          >
            <Input
              type="password"
              defaultValue={setting.value}
              onChange={(val) => this.setVal(setting.key, val.target.value)}
            />
          </Form.Item>
        );
      default:
        return (
          <Form.Item
            label={setting.name}
            key={setting._id}
            help={setting.description}
            extra={setting.extra}
          >
            <Input
              defaultValue={setting.value}
              ref={ref}
              key={`input${setting._id}`}
              onChange={(val) => this.setVal(setting.key, val.target.value)}
            />
            {this.renderUpload(setting, ref)}
          </Form.Item>
        );
    }
  }

  render() {
    const {
      updating, selectedTab, list, loading, disableButton
    } = this.state;
    const fixedTabs = ['commission', 'ccbill', 'custom', 'mailer', 'recapcha'];
    const layout = fixedTabs.includes(selectedTab)
      ? {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 }
      }
      : {
        labelCol: { span: 4 },
        wrapperCol: { span: 16 }
      };

    const initialValues = {} as any;
    list.forEach((item: ISetting) => {
      initialValues[item.key] = item.value;
    });
    return (
      <>
        <Head>
          <title>Site Settings</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Site settings' }
          ]}
        />
        <Page>
          <div style={{ marginBottom: '20px' }}>
            <Menu
              onClick={this.onMenuChange.bind(this)}
              selectedKeys={[selectedTab]}
              mode="horizontal"
              disabledOverflow
              style={{ display: 'flex', overflow: 'auto', overflowY: 'hidden' }}
            >
              <Menu.Item key="general">General</Menu.Item>
              <Menu.Item key="email">Email</Menu.Item>
              <Menu.Item key="custom">Custom</Menu.Item>
              <Menu.Item key="commission">Commission</Menu.Item>
              <Menu.Item key="ccbill">CCbill</Menu.Item>
              <Menu.Item key="mailer">SMTP</Menu.Item>
              <Menu.Item key="analytics">Google Analytics</Menu.Item>
              <Menu.Item key="default-price">Default Price</Menu.Item>
              <Menu.Item key="customText">Custom Text</Menu.Item>
              <Menu.Item key="ant">Ant Media</Menu.Item>
              <Menu.Item key="firebase">Firebase</Menu.Item>
              <Menu.Item key="recapcha">Recaptcha</Menu.Item>
              <Menu.Item key="currency">Currency</Menu.Item>
              <Menu.Item key="camAggregator">Cam aggregator</Menu.Item>
              <Menu.Item key="currencyConversion">Currency conversion</Menu.Item>
              <Menu.Item key="homepage">Homepage</Menu.Item>
              <Menu.Item key="referral">Referral</Menu.Item>
              <Menu.Item key="rank">User Badging</Menu.Item>
              <Menu.Item key="lovense">Lovense</Menu.Item>

            </Menu>
          </div>

          {loading ? (
            <Loader spinning />
          ) : (
            <Form
              {...layout}
              layout={
                fixedTabs.includes(selectedTab) ? 'vertical' : 'horizontal'
              }
              name="setting-frm"
              onFinish={this.submit.bind(this)}
              initialValues={initialValues}
              key={this._key}
              ref={this.formRef}
            >
              {list.map((setting) => this.renderFormItem(setting))}
              {selectedTab === 'mailer' && (
                <Form.Item>
                  <Button
                    disabled={updating}
                    loading={updating}
                    onClick={this.verifyMailer.bind(this)}
                    type="primary"
                  >
                    Once saved, click here to send a testing email using this
                    configuration above
                  </Button>
                </Form.Item>
              )}
              <Form.Item
                wrapperCol={{ ...layout.wrapperCol, offset: 4 }}
                style={{ textAlign: 'right' }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updating}
                  disabled={disableButton}
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

export default Settings;
