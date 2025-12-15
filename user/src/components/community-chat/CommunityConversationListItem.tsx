import {
  DeleteOutlined, LogoutOutlined, PlusOutlined
} from '@ant-design/icons';
import { Popconfirm, Tooltip } from 'antd';
import React from 'react';

import styles from './CommunityConversationListItem.module.less';

interface Iprops {
  currentUser: any;
  data: any;
  setActive: Function;
  selected: boolean;
  deleteTheConversation: Function;
  userLeaveTheConversation: Function;
  userJoinTheConversation?: Function;
}

export default function CommunityConversationListItem({
  currentUser,
  data,
  setActive,
  selected,
  deleteTheConversation,
  userLeaveTheConversation,
  userJoinTheConversation = null
}: Iprops) {
  const className = selected ? `${styles['conversation-list-item']} active` : styles['conversation-list-item'];

  return (
    <div
      aria-hidden="true"
      className={className}
    >
      <div className={styles.conversation} aria-hidden="true" onClick={() => setActive(data._id)}>
        <Tooltip title={data.name}>
          <span className={styles['conversation-name']}>{data.name || 'N/A'}</span>
        </Tooltip>
        {' '}
      </div>
      <div style={{ marginLeft: 'auto' }}>
        {deleteTheConversation && currentUser && currentUser.isPerformer && currentUser._id === data.performerId && (
        <Popconfirm
          title="Are you sure to delete this conversation?"
          onConfirm={() => deleteTheConversation(data._id)}
          okText="Yes"
          cancelText="No"
        >
          <DeleteOutlined />
        </Popconfirm>
        )}

        {userLeaveTheConversation && currentUser && !currentUser.isPerformer && (
        <Popconfirm
          title="Are you sure you want to leave the conversation?"
          onConfirm={() => userLeaveTheConversation(data._id)}
          okText="Yes"
          cancelText="No"
        >
          <LogoutOutlined />
        </Popconfirm>
        )}

        {userJoinTheConversation && (
        <span>
          <Tooltip title="Join conversation">
            Join
            {' '}
            <PlusOutlined onClick={() => userJoinTheConversation(data._id)} />
          </Tooltip>
        </span>
        )}
      </div>
    </div>
  );
}
