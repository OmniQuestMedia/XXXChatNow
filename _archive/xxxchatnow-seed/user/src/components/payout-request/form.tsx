import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic
} from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import {
  PAYMENT_ACCOUNT,
  paymentAccountTypes,
  PayoutRequestInterface
} from 'src/interfaces';
import { tailFormItemLayout } from 'src/lib';
import { payoutRequestService } from 'src/services';

import style from './index.module.less';

interface Props {
  submit(value): Function;
  submitting: boolean;
  payout: Partial<PayoutRequestInterface>;
  role?: string;
}

function PayoutRequestForm({
  payout,
  submit,
  submitting,
  role = 'performer'
}: Props) {
  const [tokenMustPay, setTokenMustPay] = React.useState(
    payout.tokenMustPay || 0
  );
  const [startDate, setStartDate] = useState<moment.Moment | null>(null);

  const [form] = Form.useForm();
  const {
    paymentAccountType, requestNote, fromDate, toDate
  } = payout;

  const handleDateChange = async (_, dateStrings: string[]) => {
    try {
      if (!dateStrings[0] || !dateStrings[1]) return;

      const query = {
        fromDate: new Date(dateStrings[0]).toISOString(),
        toDate: moment(dateStrings[1]).endOf('day').toISOString()
      };
      const resp = await payoutRequestService.calculate(query, role);
      setTokenMustPay(resp.data.totalPrice);
      // setPreviousPaidOut(resp.data.paidPrice);
      // setPendingToken(resp.data.remainingPrice);
    } catch {
      message.error('Something went wrong. Please try to input date again!');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className={style['payout-request-form']}
      name="payoutRequestForm"
      onFinish={submit}
      initialValues={{
        paymentAccountType: paymentAccountType || PAYMENT_ACCOUNT.WIRE,
        requestNote: requestNote || '',
        date: fromDate && toDate ? [moment(fromDate), moment(toDate)] : []
      }}
    >
      <Row>
        <Col xs={24} sm={24}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please input the date!' }]}
          >
            <DatePicker.RangePicker
              onChange={handleDateChange}
              disabled={!!payout?._id}
              onCalendarChange={(dates) => {
                setStartDate(dates?.[0] || null);
              }}
              disabledDate={(currentDate) => {
                const today = moment().startOf('day');
                if (!startDate) {
                  return currentDate.isSameOrAfter(today);
                }
                return currentDate.isSameOrBefore(startDate, 'day');
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24}>
          <Space size="large">
            <Statistic
              title="Earnings For The Selected Date"
              value={tokenMustPay}
              precision={2}
            />
            {/* <Statistic
              title="Previous Payout"
              value={previousPaidOut}
              precision={2}
            />
            <Statistic
              title="Paid Amount"
              value={pendingToken}
              precision={2}
            /> */}
          </Space>
        </Col>
      </Row>
      <Form.Item label="Payment Account Type" name="paymentAccountType">
        <Select disabled={!!payout?._id}>
          {paymentAccountTypes.map((t) => (
            <Select.Option value={t.value} key={t.value}>
              {t.title}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Comment" name="requestNote">
        <Input.TextArea rows={4} disabled={!!payout?._id} />
      </Form.Item>
      <Form.Item {...tailFormItemLayout}>
        <Button
          type="primary"
          loading={submitting}
          htmlType="submit"
          disabled={!tokenMustPay || !!payout?._id}
        >
          Save Change
        </Button>
      </Form.Item>
    </Form>
  );
}

export default PayoutRequestForm;
