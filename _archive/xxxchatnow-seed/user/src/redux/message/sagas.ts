import { createSagas } from '@lib/redux';
import { currentUserSelector } from '@redux/selectors';
import { communityChatService } from '@services/commnunity-chat.service';
import { messageService } from '@services/message.service';
import { message } from 'antd';
import { flatten } from 'lodash';
import { put, select } from 'redux-saga/effects';
import { IReduxAction } from 'src/interfaces';

import {
  fetchingMessage,
  getCommunityConversations,
  getCommunityConversationsFail,
  getCommunityConversationsSuccess,
  getConversationDetail,
  getConversationDetailSuccess,
  getConversations,
  getConversationsFail,
  getConversationsSuccess,
  loadMessages,
  loadMessagesFail,
  loadMessagesSuccess,
  loadMoreMessages,
  loadMoreMessagesFail,
  loadMoreMessagesSuccess,
  readMessages,
  searchConversations,
  searchConversationsFail,
  searchConversationsSuccess,
  sendMessage,
  sendMessageFail,
  sendMessageSuccess,
  setActiveCommunityConversation,
  setActiveCommunityConversationFail,
  setActiveCommunityConversationSuccess,
  setActiveConversation,
  setActiveConversationFail,
  setActiveConversationSuccess,
  updateLastMessage
} from './actions';

const conversationSagas = [
  {
    on: getConversations,
    * worker(data: IReduxAction<Record<string, string>>) {
      try {
        const resp = yield messageService.getConversations(data.payload);
        yield put(getConversationsSuccess(resp.data));
      } catch (e) {
        // TODO - alert error
        const error = yield Promise.resolve(e);
        yield put(getConversationsFail(error));
      }
    }
  },
  {
    on: getCommunityConversations,
    * worker(data: IReduxAction<Record<string, string>>) {
      try {
        const currentUser = yield select(currentUserSelector);
        const resp = yield currentUser.isPerformer ? communityChatService.searchConversation(data.payload) : communityChatService.userSearchConversation(data.payload);
        yield put(getCommunityConversationsSuccess(resp.data));
      } catch (e) {
        // TODO - alert error
        const error = yield Promise.resolve(e);
        yield put(getCommunityConversationsFail(error));
      }
    }
  },
  {
    on: searchConversations,
    * worker(data: IReduxAction<Record<string, string>>) {
      try {
        const resp = yield messageService.getConversations(data.payload);
        yield put(searchConversationsSuccess(resp.data));
      } catch (e) {
        // TODO - alert error
        const error = yield Promise.resolve(e);
        yield put(searchConversationsFail(error));
      }
    }
  },
  {
    on: setActiveConversation,
    * worker(data: IReduxAction<Record<string, string>>) {
      try {
        const {
          source, sourceId, conversationId, recipientId
        } = data.payload;
        const conversationMapping = yield select((state) => state.conversation.mapping);
        if (conversationId) {
          // todo - check me later

          if (conversationMapping[conversationId]) {
            yield put(
              setActiveConversationSuccess(conversationMapping[conversationId])
            );

            const readAllMessages = yield messageService.readAllInConversation(conversationId, recipientId);
            if (readAllMessages) {
              yield put(readMessages(conversationId));
            }
            yield put(loadMessages({ conversationId, limit: 25, offset: 0 }));
          } else {
            // TODO - check me later, query to DB and update here
          }
        } else {
          const resp = yield messageService.createConversation({
            source,
            sourceId
          });
          const conversation = resp.data;
          if (conversationMapping[conversation._id]) {
            yield put(setActiveConversationSuccess(conversationMapping[conversation._id]));
          } else {
            yield put(setActiveConversationSuccess(conversation));
          }
          yield put(loadMessages({ conversationId: conversation._id, limit: 25, offset: 0 }));
          const readAllMessages = yield messageService.readAllInConversation(conversation._id, recipientId);
          if (readAllMessages) {
            yield put(readMessages(conversation._id));
          }
        }
      } catch (e) {
        message.error('Error occured, please try again later');
        yield put(setActiveConversationFail(e));
      }
    }
  },
  {
    on: setActiveCommunityConversation,
    * worker(data: IReduxAction<Record<string, string>>) {
      try {
        const {
          source, sourceId, conversationId
        } = data.payload;
        const conversationMapping = yield select((state) => state.conversation.mapping);
        if (conversationId) {
          // todo - check me later

          if (conversationMapping[conversationId]) {
            yield put(
              setActiveCommunityConversationSuccess(conversationMapping[conversationId])
            );

            yield put(loadMessages({ conversationId, limit: 25, offset: 0 }));
          } else {
            // TODO - check me later, query to DB and update here
          }
        } else {
          const resp = yield messageService.createConversation({
            source,
            sourceId
          });
          const conversation = resp.data;
          if (conversationMapping[conversation._id]) {
            yield put(setActiveCommunityConversationSuccess(conversationMapping[conversation._id]));
          } else {
            yield put(setActiveCommunityConversationSuccess(conversation));
          }
          yield put(loadMessages({ conversationId: conversation._id, limit: 25, offset: 0 }));
        }
      } catch (e) {
        message.error('Error occured, please try again later');
        yield put(setActiveCommunityConversationFail(e));
      }
    }
  },
  {
    on: getConversationDetail,
    * worker(data: IReduxAction<Record<string, string>>) {
      try {
        const conversation = yield messageService.getConversationDetail(data.payload.id);
        yield put(getConversationDetailSuccess(conversation.data));
      } catch (e) {
        yield put(getConversationsFail(e));
      }
    }
  }
];

const messageSagas = [
  {
    on: loadMessages,
    * worker(data: IReduxAction<Record<string, any>>) {
      try {
        const messageMap = select((state) => state.message.mapping);
        const { conversationId, offset, limit } = data.payload;
        if (messageMap[conversationId] && messageMap[conversationId].fetching) {
          // do nothing if it is fetching
          return;
        }
        yield put(fetchingMessage({ conversationId }));
        const resp = yield messageService.getMessages(conversationId, { offset, limit });
        yield put(
          loadMessagesSuccess({
            conversationId,
            items: resp.data.data,
            total: resp.data.total
          })
        );
      } catch (e) {
        message.error('Error occured, please try again later');
        yield put(loadMessagesFail(e));
      }
    }
  },
  {
    on: loadMoreMessages,
    * worker(data: IReduxAction<Record<string, any>>) {
      try {
        const messageMap = select((state) => state.message.mapping);
        const { conversationId, offset, limit } = data.payload;
        if (messageMap[conversationId] && messageMap[conversationId].fetching) {
          // do nothing if it is fetching
          return;
        }
        yield put(fetchingMessage({ conversationId }));
        const resp = yield messageService.getMessages(conversationId, { offset, limit });
        yield put(
          loadMoreMessagesSuccess({
            conversationId,
            items: resp.data.data,
            total: resp.data.total
          })
        );
      } catch (e) {
        message.error('Error occured, please try again later');
        yield put(loadMoreMessagesFail(e));
      }
    }
  },
  {
    on: sendMessage,
    * worker(req: IReduxAction<any>) {
      try {
        const { conversationId, data } = req.payload;
        const resp = yield messageService.sendMessage(conversationId, data);
        yield put(sendMessageSuccess(resp.data));
        yield put(updateLastMessage({ conversationId, lastMessage: data.text }));
      } catch (e) {
        yield put(sendMessageFail(e));
      }
    }
  }
];

export default flatten([
  createSagas(conversationSagas),
  createSagas(messageSagas)
]);
