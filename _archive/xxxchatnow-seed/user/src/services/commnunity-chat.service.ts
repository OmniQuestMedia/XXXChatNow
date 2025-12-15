import { APIRequest } from './api-request';

export class CommunityChatService extends APIRequest {
  searchConversation(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/community-chat', query));
  }

  userSearchConversation(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/community-chat/channel/list', query));
  }

  search(query?: { [key: string]: any }) {
    return this.get(this.buildUrl('/community-chat/channel/search', query));
  }

  createChannel(payload: any) {
    return this.post('/community-chat/create', payload);
  }

  deleteTheConversation(conversationId: string) {
    return this.del(`/community-chat/delete/${conversationId}`);
  }

  userJoinTheConversation(conversationId: string) {
    return this.post(`/community-chat/join/${conversationId}`);
  }

  userLeaveTheConversation(conversationId: string) {
    return this.put(`/community-chat/leave/${conversationId}`);
  }

  listParticipant(conversationId) {
    return this.get(`/community-chat/channel/${conversationId}/members`);
  }
}

export const communityChatService = new CommunityChatService();
