import { getResponseError } from '@lib/utils';
import {
  Card, Col,
  message, Row
} from 'antd';
import React, { useEffect, useState } from 'react';
import { performerService, studioService } from 'src/services';

import style from './commission-card.module.less';

const DataMap = [
  { label: 'Tip Commission', key: 'tipCommission' },
  { label: 'Private Call Commission', key: 'privateCallCommission' },
  { label: 'Group Call Commission', key: 'groupCallCommission' },
  { label: 'Product Commission', key: 'productCommission' },
  { label: 'Gallery Commission', key: 'albumCommission' },
  { label: 'Video Commission', key: 'videoCommission' },
  { label: 'Wheel Commission', key: 'spinWheelCommission' }
];

interface IProps {
  role?: string;
}

function CommissionCard({
  role = 'performer'
}: IProps) {
  const [commission, setCommission] = useState(null);

  const getInfoStudio = () => studioService.me();

  useEffect(() => {
    const getCommission = async () => {
      try {
        const resp = role === 'studio'
          ? await getInfoStudio()
          : await performerService.getCommission();
        setCommission(resp.data);
      } catch (e) {
        const err = await Promise.resolve(e);
        message.error(getResponseError(err));
      }
    };
    getCommission();
  }, []);

  if (commission && role === 'studio') {
    return (
      <Row gutter={[10, 10]}>
        {DataMap.map((m) => (
          <Col xs={24} sm={8} key={m.key}>
            <Card
              className="card-commission"
              {...style}
              title={<span>{m.label}</span>}
              extra={(
                <span style={{ color: '#ff0066' }}>
                  {commission[m.key]}
                  %
                </span>
              )}
            />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[10, 10]}>
      {DataMap.map((m) => (
        <Col xs={24} sm={8} key={m.key}>
          <Card
            className="card-commission"
            {...style}
            title={<span>{m.label}</span>}
            extra={(commission && (
              <span style={{ color: '#ff0066' }}>
                {commission[m.key] || commission}
                %
              </span>
            )
            )}
          />
        </Col>
      ))}
    </Row>
  );
}

export default CommissionCard;
