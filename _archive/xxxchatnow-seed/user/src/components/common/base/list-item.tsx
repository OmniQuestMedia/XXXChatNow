import { Col, List, Row } from 'antd';
import React from 'react';

interface IProps {
  title: any;
  description: any;
  titleLayout?: any;
  descriptionLayout?: any;
}
function ListItem({
  title,
  description,
  titleLayout = {},
  descriptionLayout = {

  }
}: IProps) {
  return (
    <List.Item>
      <Row style={{ width: '100%' }}>
        <Col className="light-text" sm={{ span: 6 }} xs={{ span: 12 }} {...titleLayout}>

          {title}

        </Col>
        <Col sm={{ span: 18 }} xs={{ span: 12 }} style={{ fontWeight: 'bold' }} {...descriptionLayout}>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            display: 'block'
          }}
          >
            {description}
          </span>
        </Col>
      </Row>
    </List.Item>
  );
}

export default ListItem;
