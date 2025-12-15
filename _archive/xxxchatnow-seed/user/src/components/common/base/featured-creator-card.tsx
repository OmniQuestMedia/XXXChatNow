import { StarOutlined } from '@ant-design/icons';
import NumberFormat from '@components/common/layout/numberformat';
import {
  Button, DatePicker, message, Popover
} from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IFeaturedCreatorPackage } from 'src/interfaces';

import style from './featured-creator-card.module.less';

interface IProps {
  featuredPackage: IFeaturedCreatorPackage;
  handleBuyFeaturedCreatorPackage: Function;
  requesting: boolean;
}

const { RangePicker } = DatePicker;

function FeaturedCreatorCard({
  featuredPackage,
  handleBuyFeaturedCreatorPackage = () => {},
  requesting
}: IProps) {
  const [startDate, setStartDate] = useState(moment().startOf('day'));
  const [dates, setDates] = useState([]);

  const disabledDate = (current) => current < startDate;

  const handleDateChange = (dateRange) => {
    if (dateRange && dateRange[0]) {
      setStartDate(dateRange[0]);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const _startDate = dateRange[0];
      const endDate = dateRange[1];

      const numberOfDaysSelected = Math.abs((endDate - _startDate) / (1000 * 60 * 60 * 24));

      if (numberOfDaysSelected <= 7) {
        setDates(dateRange);
      } else {
        setDates(dateRange);
        message.error('You can only choose up to 7 days');
      }
    }
  };

  const onBuyFeaturedCreatorPackage = () => {
    const numberOfDaysBooked = Math.abs((dates[0] - dates[1]) / (1000 * 60 * 60 * 24));

    if (numberOfDaysBooked > 7) {
      message.error('You can only choose up to 7 days');
      return;
    }
    

    handleBuyFeaturedCreatorPackage(featuredPackage._id, dates);
  };

  return (
    <div className={style['token-card']}>
      <div className="card-image">
        <div className="coin">
          <div className="current-coin">
            <StarOutlined style={{ fontSize: 50, color: 'yellow' }} />
          </div>
        </div>
      </div>
      <NumberFormat value={featuredPackage.price} suffix=" tokens per day" />
      <br />
      <p>{featuredPackage.name}</p>
      {featuredPackage.description
        ? (<Popover content={featuredPackage.description}><div className="description">{featuredPackage.description}</div></Popover>)
        : (<div style={{ color: '#000000' }}>No description</div>)}
      <RangePicker
        disabledDate={disabledDate}
        // onCalendarChange={handleCalendarChange}
        onChange={handleDateChange}
      />
      <br />
      <br />
      <Button
        type="primary"
        onClick={onBuyFeaturedCreatorPackage}
        loading={requesting}
        disabled={requesting}
      >
        Enroll Now
      </Button>
    </div>
  );
}

const mapStateToProps = (state : any) => ({
  ...state.ui
});

export default connect(mapStateToProps)(FeaturedCreatorCard);
