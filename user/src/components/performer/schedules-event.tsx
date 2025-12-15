import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Row,
  Space,
  TimePicker
} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import { useEffect, useState } from 'react';

import style from './performer-event.module.less';

interface IProps {
  visible: boolean;
  cancel: () => void;
  selectedDate: any;
  availableSlots: any;
  onDeleteSlot: Function;
  submiting: boolean;
  onSubmit: Function;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export function SchedulesEvent({
  visible, cancel, selectedDate, availableSlots, onDeleteSlot, submiting, onSubmit
}: IProps) {
  const [editingSlot, setEditingSlot] = useState(null);
  const [form] = Form.useForm();

  const selectedDateSlots = availableSlots.filter((slot) => moment(slot.startAt).isSame(moment(selectedDate), 'date'));

  const onEditSlot = (id: string) => {
    const slot = availableSlots.find((s) => s._id === id);
    setEditingSlot(id);
    form.setFieldsValue({
      ...slot,
      schedule: [moment(slot.startAt), moment(slot.endAt)]
    });
  };

  const getDisabledHours = () => ({
    disabledHours: () => {
      const hours = [];
      if (selectedDate.isAfter(moment())) return hours;
      for (let i = 0; i < moment().hour(); i += 1) {
        hours.push(i);
      }
      return hours;
    }
  });

  useEffect(() => {
    form && form.resetFields();
    setEditingSlot(null);
  }, [visible]);

  return (
    <Modal
      title="Schedule"
      visible={visible}
      width={990}
      onCancel={cancel}
      footer={null}
      className={style['schedule-modal-wrapper']}
    >
      <Form
        {...layout}
        form={form}
        onFinish={(values) => {
          const data = { ...values };
          [data.startAt, data.endAt] = data.schedule;
          delete data.schedule;
          if (editingSlot) {
            data.editingSlot = editingSlot;
          }
          onSubmit({
            ...data,
            startAt: moment(data.startAt)
              .set('date', moment(selectedDate).date())
              .set('month', moment(selectedDate).month())
              .set('year', moment(selectedDate).year()),
            endAt: moment(data.endAt)
              .set('date', moment(selectedDate).date())
              .set('month', moment(selectedDate).month())
              .set('year', moment(selectedDate).year())
          });
          form.resetFields();
        }}
      >
        <Alert
          type="warning"
          message={`Please take note about timezone GMT ${moment(
            selectedDate
          ).format('Z')}`}
        />
        <div style={{ margin: '10px 0' }}>
          <p className="text-center">
            Current events on
            {' '}
            <b>{moment(selectedDate).format('dddd, MMMM Do YYYY')}</b>
          </p>
          <Row>
            <Col span={6}>Title</Col>
            <Col span={4}>Start</Col>
            <Col span={4}>End</Col>
            <Col span={6}>Description</Col>
            <Col span={4}>Action</Col>
          </Row>
          {selectedDateSlots && selectedDateSlots.length > 0 && (
            selectedDateSlots.map((item) => (
              <Row key={item._id}>
                <Col span={6}>{item.title}</Col>
                <Col span={4}>{moment(item.startAt).format('HH:mm')}</Col>
                <Col span={4}>{moment(item.endAt).format('HH:mm')}</Col>
                <Col span={6}>{item.description}</Col>
                <Col span={4}>
                  <Space size={5}>
                    <Button
                      className={style['btn-desktop']}
                      disabled={item.isPrivate || submiting}
                      onClick={() => onEditSlot(item._id)}
                    >
                      <EditOutlined />
                    </Button>
                    <Button
                      className={style['btn-desktop']}
                      disabled={item.isPrivate || submiting}
                      onClick={() => onDeleteSlot(item._id)}
                    >
                      <DeleteOutlined />
                    </Button>
                    <Dropdown
                      overlay={(
                        <Menu>
                          <Menu.Item
                            disabled={submiting}
                            onClick={() => onEditSlot(item._id)}
                          >
                            Update
                          </Menu.Item>
                          <Menu.Item
                            disabled={submiting}
                            onClick={() => onDeleteSlot(item._id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu>
                      )}
                    >
                      <Button className={style['btn-mobile']}>
                        <MoreOutlined />
                      </Button>
                    </Dropdown>
                  </Space>
                </Col>
              </Row>
            ))
          )}
          <p className="text-center">{selectedDateSlots && selectedDateSlots.length > 0 ? 'Create new event' : 'No event added'}</p>
        </div>
        <Form.Item
          name="title"
          label="Title"
          wrapperCol={{ span: 12 }}
        >
          <Input type="text" />
        </Form.Item>
        <Form.Item
          label="Schedule"
          name="schedule"
          rules={[
            { required: true, message: 'This field is required!' },
            {
              validator: (_, v) => {
                if (Array.isArray(v) && v.every((t) => moment.isMoment(t))) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error('Please select time'));
              }
            }
          ]}
        >
          <TimePicker.RangePicker
            disabledTime={getDisabledHours}
            format="HH:mm"
            minuteStep={5}
          />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" disabled={submiting} htmlType="submit">
              Submit
            </Button>
            <Button onClick={() => [form.resetFields(), setEditingSlot(null)]}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
