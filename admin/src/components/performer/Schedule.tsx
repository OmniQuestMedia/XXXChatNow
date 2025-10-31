import {
  Button, Checkbox, Form, TimePicker
} from 'antd';
import moment from 'moment';
import { PureComponent } from 'react';
import { IPerformerUpdate, ISchedule } from 'src/interfaces';

const layout = {
  labelCol: { lg: { span: 4 }, sm: { span: 6 } },
  wrapperCol: { lg: { span: 16 }, sm: { span: 14 } }
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
  performer?: IPerformerUpdate;
  onFinish?: Function;
  onFormRefSubmit?: Function;
  submiting: boolean;
  onChangeTime: Function;
  scheduleValue: ISchedule;
  onChangeCloded: Function;
}

export class PerformerSchedule extends PureComponent<IProps> {
  render() {
    const {
      onFormRefSubmit,
      submiting,
      onChangeTime,
      scheduleValue,
      onChangeCloded
    } = this.props;
    const dayValue = {
      mon: {
        day: 'Monday'
      },
      tue: {
        day: 'Tuesday'
      },
      wed: {
        day: 'Wednesday'
      },
      thu: {
        day: 'Thursday'
      },
      fri: {
        day: 'Friday'
      },
      sat: {
        day: 'Saturday'
      },
      sun: {
        day: 'Sunday'
      }
    };
    const format = 'HH:mm';
    const { RangePicker } = TimePicker;
    return (
      <Form
        {...layout}
        name="form-performer-schedule"
        onFinish={() => onFormRefSubmit()}
        validateMessages={validateMessages}
      >
        {Object.keys(dayValue).map((key) => (
          <Form.Item
            key={key}
            label={dayValue[key].day}
            initialValue={[
              moment(scheduleValue[key].start, format),
              scheduleValue[key].end
                ? moment(scheduleValue[key].end, format)
                : moment()
            ]}
          >
            <RangePicker
              onChange={(dates: any[], dateStrings: [string, string]) => onChangeTime(dates, dateStrings, key)}
              // showTime
              format={format}
              style={{ marginRight: 10 }}
            />
            <Checkbox
              name={key}
              key={key}
              defaultChecked={scheduleValue[key].closed}
              onChange={(e) => onChangeCloded(e.target.checked, key)}
            >
              Not Available
            </Checkbox>
          </Form.Item>
        ))}
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 4 }}>
          <Button type="primary" htmlType="submit" loading={submiting}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
