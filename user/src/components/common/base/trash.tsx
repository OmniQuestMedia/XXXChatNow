import { DeleteOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import React from 'react';

interface P {
  confirm: (e?: React.MouseEvent<HTMLElement>) => void;
}

function PopupConfirm({ confirm }: P) {
  return (
    <Popconfirm
      title="Are you sure want to delete this item?"
      okText="Yes I want to delete"
      cancelText="I dont'want to delete"
      placement="right"
      onConfirm={confirm}
    >
      <Button type="link">
        <DeleteOutlined />
      </Button>
    </Popconfirm>
  );
}

export default PopupConfirm;
