import { eventsListingService } from '@services/events-listing.service';
import { Calendar, message, Tooltip } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { IPerformer } from 'src/interfaces';

import { ScheduledLiveItem } from './item-details';
import style from './list-item.module.less';

interface IProps {
    performer: IPerformer;
}

export function PerformerScheduledPremiumLive({ performer }: IProps) {
  const [availableSlots, setAvailableSlots] = useState({
    data: [],
    total: 0
  });

  const [mode, setMode] = useState('month');
  const [visibleSelectDateModal, setVisibleSelectDateModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visisbleDate, setVisisbleDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());

  const onSelectDate = async (date: moment.Moment) => {
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
          type: moment().isBefore(moment(slot.startAt)) ? 'success' : 'error',
          content: `${moment(slot.startAt).format('HH:mm')} - ${moment(
            slot.endAt
          ).format('HH:mm')}`
        };
      }
      return slot;
    });
    return listData || [];
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
              error: item.type === 'error'
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

  const getAvailableSlots = async () => {
    try {
      const resp = await (
        await eventsListingService.userGetSchedules({
          startAt: moment(moment(visisbleDate).subtract(1, 'month')).startOf('month').toISOString(),
          endAt: moment(moment(visisbleDate).add(1, 'month')).endOf('month').toISOString(),
          performerId: performer._id
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

  const onCalenderPanelChange = (_, type: 'month' | 'year') => {
    setMode(type);
    getAvailableSlots();
  };

  const disabledDate = (date: moment.Moment) => {
    if (moment(date).endOf('day').isBefore(moment())) {
      return true;
    }

    const isAvailable = availableSlots.data.find((slot) => moment(slot.startAt).isBetween(moment(date).startOf('date'), moment(date).endOf('date')));
    if (isAvailable) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    getAvailableSlots();
  }, [visisbleDate]);

  return (
    <div style={{ marginBottom: '25px' }}>
      <div className={style['text-at-the-top']}>
        {performer?.name || performer?.username}
        &apos;s availability in
        {' '}
        {moment(visisbleDate).format('MMMM YYYY')}
        {' '}
        Select a date to begin.
        <br />
        {success && availableSlots.total === 0 && 'Select date to purchase'}
      </div>

      <Calendar
        className={style['booking-calendar']}
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
      <ScheduledLiveItem
        visible={visibleSelectDateModal}
        cancel={() => setVisibleSelectDateModal(false)}
        selectedDate={selectedDate}
        availableSlots={availableSlots.data}
      />
      )}
    </div>
  );
}
