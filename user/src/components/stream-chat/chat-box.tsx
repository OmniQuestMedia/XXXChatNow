import StreamMessenger from '@components/stream-chat/Messenger';
import UserList from '@components/stream-chat/UserList';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { TabPane, Tabs } from 'src/components/common/base/tabs';
import { IPerformer, IUser } from 'src/interfaces';

import style from './chat-box.module.less';

const CommunityConversationPublicList = dynamic(() => import('@components/community-chat').then((mod) => mod.CommunityConversationPublicList), { ssr: false });

interface IProps {
  totalParticipant?: number;
  activeConversation?: any;
  currentPerformer?: IPerformer;
  members?: IUser[];
  onBlockUser?: Function;
  activeTab?: string;
  onTabChange?: Function;
  activeCommunityChat?: boolean;
}
function ChatBox({
  activeConversation = null,
  totalParticipant = 0,
  currentPerformer = null,
  members = [],
  onBlockUser = () => {},
  activeTab = 'chat',
  onTabChange = () => {},
  activeCommunityChat = false
}: IProps) {
  const [tb, setTb] = useState(activeTab);

  useEffect(() => {
    setTb(activeTab);
  }, [activeTab]);

  return (
    <div className={style['conversation-stream']}>
      <Tabs
        defaultActiveKey={tb}
        activeKey={tb}
        onChange={(tab) => {
          setTb(tb);
          onTabChange(tab);
        }}
      >
        <TabPane tab="Chat" key="chat">
          {activeConversation?.data?.streamId && (
            <StreamMessenger
              streamId={activeConversation.data.streamId}
            />
          )}
        </TabPane>
        <TabPane tab={`User (${totalParticipant || 0})`} key="user">
          <UserList
            currentPerformer={currentPerformer}
            members={members}
            onBlocked={onBlockUser}
          />
        </TabPane>
        {activeCommunityChat && activeConversation?.data?.performerId && (
        <TabPane tab="Community Chat" key="community_chat">
          <CommunityConversationPublicList performerId={activeConversation.data.performerId} />
        </TabPane>
        )}
      </Tabs>
    </div>
  );
}

export default ChatBox;
