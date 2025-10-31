import {
  Button, Col, Input, Row, Select
} from 'antd';
import React, { PureComponent } from 'react';

interface IProps {
  onSubmit: Function;
  onExportCsv: Function;
  defaultValues?: Partial<{ q: string, role: string, status: string}>
}

export class SearchFilter extends PureComponent<IProps> {
  state = {
    q: '',
    role: '',
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
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(role) => this.setState({ role })}
          >
            <Select.Option value="">Role</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="user">User</Select.Option>
          </Select>
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
        <Col xl={{ span: 4 }} md={{ span: 8 }}>
          <Button
            type="primary"
            onClick={() => this.props.onExportCsv(this.state)}
          >
            Export Csv
          </Button>
        </Col>
      </Row>
    );
  }
}
