import { SearchOutlined } from '@ant-design/icons';
import {
  Button, Form, Input, Select
} from 'antd';
import React from 'react';

interface IProps {
  onSearch?: () => void;
  searching?: boolean;
}

function StudioModelsSearch({
  onSearch = () => {},
  searching = false
}: IProps) {
  return (
    <div>
      <Form
        onFinish={onSearch}
        name="studioSearchModels"
        // className="performerEditForm"
        layout="vertical"
        initialValues={{
          q: '',
          status: ''
        }}
      >
        <Form.Item name="q" key="name">
          <Input
            type="text"
            prefix={<SearchOutlined className="site-form-item-icon" />}
            placeholder="Search..."
          />
        </Form.Item>
        <Form.Item name="status" key="onlineStatus">
          <Select>
            <Select.Option value="" key="">
              All Status
            </Select.Option>
            <Select.Option value="active" key="active">
              Active
            </Select.Option>
            <Select.Option value="inactive" key="inactive">
              Inactive
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={searching} loading={searching}>
            Search
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default StudioModelsSearch;
