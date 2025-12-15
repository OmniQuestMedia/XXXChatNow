import { Badge } from 'antd';
import moment from 'moment';
import React from 'react';

import style from './ConversationListItem.module.less';

interface Iprops {
  data: any;
  selected: boolean;
  setActive: Function;
}

export default function ConversationListItem(props: Iprops) {
  const { setActive, selected, data } = props;
  const {
    recipientInfo, lastMessage, _id, updatedAt, lastMessageCreatedAt, totalNotSeenMessages = 0
  } = data;

  const className = selected
    ? `${style['conversation-list-item']} active`
    : style['conversation-list-item'];

  return (
    <div
      aria-hidden="true"
      className={className}
      onClick={() => setActive(_id)}
    >
      <div className={style['conversation-left-corner']}>
        <img className={style['conversation-photo']} src={recipientInfo?.avatar || '/default-user-icon.png'} alt="conversation" />
      </div>
      <div className={style['conversation-info']}>
        <h1 className={style['this-conversation-username']}>
          {recipientInfo?.displayName || recipientInfo.username || 'N/A'}
        </h1>
        <p className={style['last-message']}>{lastMessage}</p>
        <p className={style['conversation-time']}>{moment(lastMessageCreatedAt || updatedAt).fromNow()}</p>
      </div>
      <Badge
        className={style['notification-badge']}
        count={totalNotSeenMessages}
      />
    </div>
  );
}
