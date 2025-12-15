import { eventsListingService } from '@services/events-listing.service';
import {
  Calendar, message, Tooltip
} from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import { useEffect, useState } from 'react';

import style from './performer-schedules.module.less';
import { SchedulesEvent } from './schedules-event';

export function PerformerSchedules() {
  const [availableSlots, setAvailableSlots] = useState({
    data: [],
    total: 0
  });
  const [mode, setMode] = useState('month');
  const [visibleSelectDateModal, setVisibleSelectDateModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submiting, setSubmiting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [visisbleDate, setVisisbleDate] = useState(moment());

  const onSelectDate = (date: moment.Moment) => {
    if (mode === 'year') {
      return;
    }

    const currentDate = moment();
    if (moment(date).isBefore(currentDate, 'date')) {
      message.error('Please just schedule slot in the future time');
      return;
    }

    setVisibleSelectDateModal(true);
    setSelectedDate(date);
  };

  const renderSlots = (value) => {
    const listData = availableSlots.data.map((slot) => {
      if (value.isSame(moment(slot.startAt), 'date')) {
        return {
          ...slot,
          type: moment().isBefore(moment(slot.startAt)) ? (!slot.isPrivate ? 'success' : 'warning') : 'error',
          content: `${moment(slot.startAt).format('HH:mm')} - ${moment(slot.endAt).format('HH:mm')}`
        };
      }
      return slot;
    });
    return listData || [];
  };

  const getAvailableSlots = async () => {
    try {
      const resp = await (
        await eventsListingService.performerGetSchedules({
          startAt: moment(moment(visisbleDate).subtract(1, 'month')).startOf('month').toISOString(),
          endAt: moment(moment(visisbleDate).add(1, 'month')).endOf('month').toISOString()
        })
      ).data;
      setAvailableSlots({ data: resp.data, total: resp.total });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(error.message || 'Error occured, please try again later');
    } finally {
      setSuccess(true);
    }
  };

  const dateSlotsRender = (value) => {
    const listData = renderSlots(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li
            key={item._id}
            className={classNames('event-status', {
              success: item.type === 'success',
              error: item.type === 'error',
              warning: item.type === 'warning'
            })}
          >
            <Tooltip title={`${item.description || item.title}`}>
              {item.content}
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const onDeleteSlot = async (slotId: string) => {
    const slot = availableSlots.data.find((s) => s._id === slotId);
    if (!window.confirm('Are you sure you would like to remove this slot?')) return;
    if (slot.isBooked) {
      message.error(
        'This slot is already booked, could not delete at this time'
      );
      return;
    }
    try {
      setSubmiting(true);
      await eventsListingService.deleteSchedule(slotId);
      getAvailableSlots();
    } catch (e) {
      const err = await e;
      message.error(err.message || 'Error occured, please try again later');
    } finally {
      setSubmiting(false);
    }
  };

  const createNewSlot = async (data) => {
    try {
      setSubmiting(true);
      if (data.editingSlot) {
        await eventsListingService.updateSchedule(data.editingSlot, data);
      } else {
        await eventsListingService.createSchedule(data);
      }
      message.success('Success');
      getAvailableSlots();
      setVisibleSelectDateModal(false);
    } catch (e) {
      const err = await e;
      message.error(err.message || 'Error occured, please try again later');
    } finally {
      setSubmiting(false);
    }
    return undefined;
  };

  const onCalenderPanelChange = (_, type: 'month' | 'year') => {
    setMode(type);
    getAvailableSlots();
  };

  const disabledDate = (date) => moment(date).endOf('day').isBefore(moment());

  useEffect(() => {
    getAvailableSlots();
  }, [visisbleDate]);

  return (
    <div>
      <div className={style['text-at-the-top']}>
        Booking Schedule Slot in
        {' '}
        {moment(visisbleDate).format('MMMM YYYY')}
        {' '}
        Select a date to begin.
        <br />
        {success && availableSlots.total === 0 && 'Select date to create new slot'}
      </div>

      <Calendar
        className={style['performer-calendar']}
        dateFullCellRender={(date) => (
          <div
            className={classNames('ant-picker-cell-inner', 'ant-picker-calendar-date', {
              'ant-picker-calendar-date-today': moment().isSame(date, 'date')
            })}
            onClick={() => onSelectDate(date)}
            aria-hidden="true"
          >
            <div className="ant-picker-calendar-date-value">
              {moment(date).get('date')}
            </div>
            <div className="ant-picker-calendar-date-content">
              {dateSlotsRender(date)}
            </div>
          </div>
        )}
        onChange={(date) => setVisisbleDate(date)}
        onPanelChange={onCalenderPanelChange}
        disabledDate={disabledDate}
        validRange={([moment().startOf('years'), moment().add(5, 'years').endOf('years')]) as any}
      />

      {selectedDate && (
        <SchedulesEvent
          visible={visibleSelectDateModal}
          selectedDate={selectedDate}
          cancel={() => setVisibleSelectDateModal(false)}
          availableSlots={availableSlots.data}
          onDeleteSlot={(slotId) => onDeleteSlot(slotId)}
          submiting={submiting}
          onSubmit={(data) => createNewSlot(data)}
        />
      )}
    </div>
  );
}
