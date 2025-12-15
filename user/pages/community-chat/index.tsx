import {
  UsergroupAddOutlined
} from '@ant-design/icons';
import {
  getCommunityConversations,
  getConversationDetail,
  receiveMessageSuccess,
  resetMessageState,
  setActiveConversation,
  updateLastMessage
} from '@redux/message/actions';
import { currentUserSelector } from '@redux/selectors';
import { communityChatService } from '@services/commnunity-chat.service';
import {
  Button, Col, message, Row, Tooltip
} from 'antd';
import dynamic from 'next/dynamic';
import Router, { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer, IUser } from 'src/interfaces';
import { Event } from 'src/socket';

import styles from './index.module.less';

const ListOfParticipants = dynamic(() => import('@components/community-chat').then((mod) => mod.ListOfParticipants), { ssr: false });
const CommunityChatGroupCreationPopup = dynamic(() => import('@components/community-chat').then((mod) => mod.CommunityChatGroupCreationPopup), { ssr: false });
const CommunityConversationListItem = dynamic(() => import('@components/community-chat').then((mod) => mod.CommunityConversationListItem), { ssr: false });
const MessageList = dynamic(() => import('@components/community-chat').then((mod) => mod.MessageList), { ssr: false });

interface IProps {
  getCommunityConversationsHandler: Function;
  currentUser: IUser;
  currentPerformer: IPerformer,
  setActiveConversationHandler: Function;
  receiveMessageSuccessHandler: Function;
  dispatchResetMessageState: Function;
  conversation: {
    list: {
      requesting: boolean;
      error: any;
      data: any[];
      total: number;
      success: boolean;
    };
    mapping: Record<string, any>;
    activeConversation: Record<string, any>;
  };
}

function CommunityChatPage({
  getCommunityConversationsHandler,
  currentUser,
  currentPerformer,
  setActiveConversationHandler,
  conversation,
  receiveMessageSuccessHandler,
  dispatchResetMessageState
}: IProps) {
  const { data: conversations, requesting, total } = conversation.list;
  const { mapping, activeConversation = {} } = conversation;
  const { query } = useRouter();
  const [searching, setSearching] = useState(false);
  const [visible, setVisible] = useState(false);
  const [sort] = useState('desc');
  const [sortBy] = useState('createdAt');
  const limit = 99;

  const getTheConversation = async (page = 1) => {
    try {
      setSearching(true);
      getCommunityConversationsHandler({
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    getTheConversation();

    return () => {
      dispatchResetMessageState();
    };
  }, []);

  const createChannel = async (data: any) => {
    try {
      const resp = await communityChatService.createChannel(data);
      if (resp.data) {
        setVisible(false);
        message.success('Created a new community chat group successfully');
      }

      window.location.href = '/community-chat';
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err.message);
    }
  };

  const deleteTheConversation = async (conversationId: string) => {
    if (!window.confirm('Do you want to delete this community group?')) {
      return;
    }

    try {
      const resp = await communityChatService.deleteTheConversation(conversationId);
      if (resp.data) {
        message.success('Deleted successfully');
      }

      window.location.href = '/community-chat';
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err.message);
    }
  };

  const userLeaveTheConversation = async (conversationId: string) => {
    if (!window.confirm('Do you want to leave this conversation?')) {
      return;
    }

    try {
      const resp = await communityChatService.userLeaveTheConversation(conversationId);
      if (resp.data) {
        message.success('You have left the conversation');
      }

      window.location.href = '/community-chat';
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(err.message);
    }
  };

  useEffect(() => {
    if (query.conversationId && conversations && conversations.length) {
      setActiveConversationHandler({
        conversationId: query.conversationId,
        recipientId: currentUser._id ? currentUser._id : currentPerformer._id
      });
    }
  }, [query.conversationId, conversations]);

  const setActive = (conversationId: any) => {
    Router.push({
      pathname: '/community-chat',
      query: {
        conversationId
      }
    });
  };

  const onMessage = async (data: { conversationId: string | number; text: any, senderId: string }) => {
    if (!data) {
      return;
    }
    if (!mapping[data.conversationId]) {
      return;
    }
    receiveMessageSuccessHandler(data);
  };

  return (
    <div className={styles['community-chat-page']}>
      <Event event="message_created" handler={onMessage} />
      <Row>
        <Col xs={24} sm={12} md={6} lg={4}>
          <div className={styles['community-chat-list']}>
            <div className={styles.title}>
              <h3>
                Community chat list
                {' '}
                <small>{`(${total})`}</small>
              </h3>
              {currentUser?.isPerformer && (
              <Tooltip title="Create conversations">
                <Button
                  shape="circle"
                  size="large"
                  icon={<UsergroupAddOutlined />}
                  disabled={searching}
                  onClick={() => setVisible(true)}
                />
              </Tooltip>
              )}
            </div>
            {conversations && conversations.map((conversationId) => (
              <CommunityConversationListItem
                currentUser={currentUser}
                data={mapping[conversationId]}
                setActive={setActive}
                selected={activeConversation._id === conversationId}
                deleteTheConversation={deleteTheConversation}
                userLeaveTheConversation={userLeaveTheConversation}
              />
            ))}
            {requesting && (
              <div className={styles['text-center']}>
                <img alt="loading" src="/loading-ico.gif" width="50px" />
              </div>
            )}
            {!requesting && !conversations.length && <p className={styles['text-center']}>No conversation found.</p>}
          </div>
        </Col>

        <Col xs={24} sm={12} md={12} lg={16}>
          <div className={styles['community-chat-content']}>
            <MessageList />
          </div>
        </Col>

        <Col xs={24} sm={12} md={6} lg={4}>
          <div className={styles.participants}>
            <div className={styles.title}>
              <h3>
                Participants
                {' '}
                <small>{`(${conversation.activeConversation?.recipients?.length || 0})`}</small>
              </h3>
            </div>
            <ListOfParticipants
              currentUser={currentUser}
              data={conversation.activeConversation}
            />
          </div>
        </Col>
      </Row>

      <CommunityChatGroupCreationPopup
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={createChannel}
      />
    </div>
  );
}

const mapStates = (state: any) => ({
  conversation: { ...state.conversation },
  currentUser: currentUserSelector(state),
  currentPerformer: state.performer.current
});

const mapDispatch = {
  getCommunityConversationsHandler: getCommunityConversations,
  setActiveConversationHandler: setActiveConversation,
  getConversationDetailHandler: getConversationDetail,
  receiveMessageSuccessHandler: receiveMessageSuccess,
  handleUpdateLastMessage: updateLastMessage,
  dispatchResetMessageState: resetMessageState
};

CommunityChatPage.authenticate = true;

export default connect(mapStates, mapDispatch)(CommunityChatPage);
