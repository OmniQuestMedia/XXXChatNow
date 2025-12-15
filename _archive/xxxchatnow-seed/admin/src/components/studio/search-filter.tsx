import {
  Button, Col, Input, Row, Select
} from 'antd';
import React, { PureComponent } from 'react';

interface IProps {
  onSubmit: Function;
  defaultValues?: Partial<{ q: string, status: string}>
}

export class SearchFilter extends PureComponent<IProps> {
  state = {
    q: '',
    status: ''
  };

  render() {
    const { defaultValues } = this.props;
    return (
      <Row gutter={24}>
        <Col xl={{ span: 4 }} md={{ span: 8 }}>
          <Input
            placeholder="Enter keyword"
            onChange={(evt) => this.setState({ q: evt.target.value })}
            onPressEnter={() => this.props.onSubmit(this.state)}
          />
        </Col>
        <Col xl={{ span: 4 }} md={{ span: 8 }}>
          <Select
            defaultValue={defaultValues?.status || ''}
            style={{ width: '100%' }}
            onChange={(status) => this.setState({ status })}
          >
            <Select.Option value="">Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Col>
        <Col xl={{ span: 2 }} md={{ span: 8 }}>
          <Button
            type="primary"
            onClick={() => this.props.onSubmit(this.state)}
          >
            Search
          </Button>
        </Col>
      </Row>
    );
  }
}
