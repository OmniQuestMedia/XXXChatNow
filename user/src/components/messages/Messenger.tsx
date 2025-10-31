import { deactiveConversation } from '@redux/message/actions';
import { Button } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import ConversationList from './ConversationList';
import MessageList from './MessageList';
import style from './messenger.module.less';

interface IProps {
  toSource: string;
  toId: string;
  activeConversation: any;
  deactiveConversation: Function;
}

function Messenger({
  toSource,
  toId,
  activeConversation,
  deactiveConversation: dispatchDeactiveConversation
}: IProps) {
  const conversationListContainer = !activeConversation._id ? style['conversation-list-container'] : `${style['conversation-list-container']} active`;
  const chatContentContainer = !activeConversation._id ? style['chat-content-container'] : `${style['chat-content-container']} active`;

  const onClose = () => {
    dispatchDeactiveConversation();
  };

  return (
    <div className={style.messenger}>
      <div className={conversationListContainer}>
        <ConversationList toSource={toSource} toId={toId} />
      </div>
      <div className={chatContentContainer}>
        <Button onClick={onClose.bind(this)} className={style['close-btn']}>close</Button>
        <MessageList />
      </div>
    </div>
  );
}

const mapStates = (state: any) => {
  const { activeConversation } = state.conversation;
  return {
    activeConversation
  };
};

const mapDispatch = { deactiveConversation };
export default connect(mapStates, mapDispatch)(Messenger);
