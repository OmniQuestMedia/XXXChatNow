import {
  Button, Col, Row, Select
} from 'antd';
import { useState } from 'react';

interface IProps {
  onSubmit?: Function;
  statuses?: {
    key: string;
    text?: string;
  }[];
}

export function OrderSearchFilter({
  statuses = [],
  onSubmit = () => {}
}: IProps) {
  const [deliveryStatus, setDeliveryStatus] = useState('');

  return (
    <Row gutter={24}>
      {statuses.length ? (
        <Col xl={{ span: 4 }} md={{ span: 8 }} xs={{ span: 10 }}>
          <span>Delivery Status</span>
          <Select
            onChange={setDeliveryStatus}
            style={{ width: '100%' }}
            placeholder="Select delivery status"
            defaultValue=""
          >
            {statuses.map((s) => (
              <Select.Option key={s.key} value={s.key}>
                {s.text || s.key}
              </Select.Option>
            ))}
          </Select>
        </Col>
      ) : null}
      <Col xl={{ span: 4 }} md={{ span: 8 }}>
        <Button
          style={{ marginTop: '22px' }}
          type="primary"
          onClick={() => onSubmit({
            deliveryStatus
          })}
        >
          Search
        </Button>
      </Col>
    </Row>
  );
}

export default OrderSearchFilter;
