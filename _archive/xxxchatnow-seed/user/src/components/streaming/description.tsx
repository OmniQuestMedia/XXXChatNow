import NumberFormat from '@components/common/layout/numberformat';
import { Col, List, Row } from 'antd';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';

interface P {
  roomJoined: boolean;
  receivedToken: number;
}

function ListItem({ description }: any) {
  return (
    <List.Item>
      <Row style={{ width: '100%' }}>
        {/* <Col className="light-text" sm={{ span: 6 }} xs={{ span: 12 }}>
          {title}
        </Col> */}
        <Col style={{ fontWeight: 'bold' }} sm={{ span: 18 }} xs={{ span: 12 }}>
          {description}
        </Col>
      </Row>
    </List.Item>
  );
}

let interval: NodeJS.Timeout;
let startAt: moment.Moment;

export function Description({ roomJoined, receivedToken }: P) {
  const [callTime, setCallTime] = useState(null);

  const handleCallTime = useCallback(() => {
    if (startAt) {
      const diff = moment().diff(startAt);
      setCallTime(moment.utc(diff).format('HH:mm:ss'));
    }
  }, [callTime]);

  useEffect(() => {
    if (roomJoined) {
      startAt = moment();
      setInterval(handleCallTime, 1000);
    } else {
      startAt = null;
      interval && clearInterval(interval);
    }
  }, [roomJoined]);

  const dataSource = [
    {
      // title: 'Status: ',
      description: roomJoined ? 'Live' : ''
    },
    {
      // title: 'Call time: ',
      description: `${callTime || 0}`
    },

    {
      // title: 'Received Token: ',
      description: <NumberFormat value={receivedToken} suffix=" token(s)" />
    }
  ];

  if (!roomJoined) return null;

  return (
    <List
      dataSource={dataSource}
      renderItem={(item) => (
        <ListItem description={item.description} />
      )}
    />
  );
}
