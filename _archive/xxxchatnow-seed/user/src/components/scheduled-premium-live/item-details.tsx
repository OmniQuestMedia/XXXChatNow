import {
  Col,
  Modal,
  Row
} from 'antd';
import moment from 'moment';

import style from './item-details.module.less';

interface IProps {
    visible: boolean;
    cancel: () => void;
    selectedDate: any;
    availableSlots: any;
}

export function ScheduledLiveItem({
  visible, cancel, selectedDate, availableSlots
}: IProps) {
  const selectedDateSlots = availableSlots.filter((slot) => moment(slot.startAt).isSame(moment(selectedDate), 'date'));

  return (
    <Modal
      title="Schedule"
      width={990}
      visible={visible}
      onCancel={cancel}
      footer={null}
      className={style['model-booking-modal-wrapper']}
    >
      <div style={{ margin: '15px 0' }}>
        <p className="text-center">
          Current events on
          {' '}
          <b>{moment(selectedDate).format('dddd, MMMM Do YYYY')}</b>
        </p>
        <Row>
          <Col span={6}>Title</Col>
          <Col span={6}>Start</Col>
          <Col span={6}>End</Col>
          <Col span={6}>Description</Col>
        </Row>
        {selectedDateSlots && selectedDateSlots.length > 0 ? (
          selectedDateSlots.map((item) => (
            <Row key={item._id}>
              <Col span={6}>{item.title}</Col>
              <Col span={6}>{moment(item.startAt).format('HH:mm')}</Col>
              <Col span={6}>{moment(item.endAt).format('HH:mm')}</Col>
              <Col span={6}>{item.description}</Col>
            </Row>
          ))
        ) : (
          <p>No events found</p>
        )}
      </div>
    </Modal>
  );
}
