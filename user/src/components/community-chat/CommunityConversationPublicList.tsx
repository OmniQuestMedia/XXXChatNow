import { getResponseError } from '@lib/utils';
import { currentUserSelector } from '@redux/selectors';
import { communityChatService } from '@services/commnunity-chat.service';
import { message } from 'antd';
import Router from 'next/router';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import CommunityConversationListItem from './CommunityConversationListItem';

interface Props {
  performerId: string;
}

export default function CommunityConversationPublicList({
  performerId
}: Props) {
  const [conversations, setConversations] = useState([]);
  const currentUser = useSelector(currentUserSelector);
  const loggedIn = useSelector((state: any) => state.auth.loggedIn);

  const join = async (conversationId) => {
    if (!loggedIn) {
      message.error('Please login to join this community chat!');
      return;
    }
    try {
      await communityChatService.userJoinTheConversation(conversationId);
      Router.push({
        pathname: '/community-chat',
        query: {
          conversationId
        }
      });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  };

  useEffect(() => {
    (async () => {
      const resp = await Promise.resolve(communityChatService.search({
        performerId
      }));
      setConversations(resp.data.data);
    })();
  }, [performerId]);

  return (
    <div>
      {conversations.length > 0
        && conversations.map((conversation) => (
          <CommunityConversationListItem
            deleteTheConversation={null}
            userLeaveTheConversation={null}
            selected={false}
            setActive={join}
            currentUser={currentUser}
            data={conversation}
            userJoinTheConversation={join}
          />
        ))}
    </div>
  );
}
