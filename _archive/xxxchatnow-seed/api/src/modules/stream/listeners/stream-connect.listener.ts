import { Injectable } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import {
  USER_LIVE_STREAM_CHANNEL,
  PERFORMER_LIVE_STREAM_CHANNEL,
  LIVE_STREAM_EVENT_NAME
} from 'src/modules/stream/constant';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { ConversationService } from 'src/modules/message/services';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { InjectModel } from '@nestjs/mongoose';
import { Stream } from '../schemas';

const USER_LIVE_STREAM_DISCONNECTED = 'USER_LIVE_STREAM_CONNECTED';
const MODEL_LIVE_STREAM_DISCONNECTED = 'MODEL_LIVE_STREAM_CONNECTED';
const USER_LEFT_ROOM = 'USER_LEFT_ROOM';

@Injectable()
export class StreamConnectListener {
  constructor(
    @InjectModel(Stream.name) private readonly StreamModel: Model<Stream>,
    private readonly queueEventService: QueueEventService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly socketUserService: SocketUserService,
    private readonly conversationService: ConversationService
  ) {
    this.queueEventService.subscribe(
      USER_LIVE_STREAM_CHANNEL,
      USER_LIVE_STREAM_DISCONNECTED,
      this.userDisconnectHandler.bind(this)
    );
    this.queueEventService.subscribe(
      PERFORMER_LIVE_STREAM_CHANNEL,
      MODEL_LIVE_STREAM_DISCONNECTED,
      this.modelDisconnectHandler.bind(this)
    );
  }

  leftRoom(conversation: any, user: any, isMember = true) {
    const { _id, type } = conversation;
    const roomName = this.conversationService.serializeConversation(_id, type);
    return Promise.all([
      this.socketUserService.emitToRoom(
        roomName,
        `message_created_conversation_${_id}`,
        {
          _id: generateUuid(),
          text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has joined this conversation`,
          conversationId: _id,
          isSystem: true
        }
      ),
      isMember && this.socketUserService.emitToRoom(roomName, USER_LEFT_ROOM, {
        username: user.username,
        conversationId: _id
      })
    ]);
  }

  async userDisconnectHandler(event: QueueEvent) {
    if (event.eventName !== LIVE_STREAM_EVENT_NAME.DISCONNECTED) {
      return;
    }

    const sourceId = event.data;
    const user = await this.userService.findById(sourceId);
    if (!user) {
      return;
    }

    const connectedRedisRooms = await this.socketUserService.userGetAllConnectedRooms(
      sourceId
    );

    if (!connectedRedisRooms.length) {
      return;
    }

    await Promise.all(
      connectedRedisRooms.map((id) => this.socketUserService.removeConnectionFromRoom(id, sourceId))
    );

    const conversationIds = connectedRedisRooms.map((id) => this.conversationService.deserializeConversationId(id));
    const conversations = await this.conversationService.findByIds(
      conversationIds
    );
    if (conversations.length) {
      await Promise.all(
        conversations.map((conversation) => this.leftRoom(conversation, user))
      );
    }
  }

  async modelDisconnectHandler(event: QueueEvent) {
    if (event.eventName !== LIVE_STREAM_EVENT_NAME.DISCONNECTED) {
      return;
    }

    const sourceId = event.data;
    const model = await this.performerService.findById(sourceId);
    if (!model) {
      return;
    }

    const connectedRedisRooms = await this.socketUserService.userGetAllConnectedRooms(
      sourceId
    );

    if (!connectedRedisRooms.length) {
      return;
    }

    await Promise.all(
      connectedRedisRooms.map((r) => this.socketUserService.removeConnectionFromRoom(r, sourceId))
    );

    const conversationIds = connectedRedisRooms.map((id) => this.conversationService.deserializeConversationId(id));
    const conversations = await this.conversationService.findByIds(
      conversationIds
    );
    if (conversations.length) {
      await Promise.all(
        conversations.map((conversation) => this.leftRoom(conversation, model, false))
      );
    }
    /**
     * To do
     * Update status
     */
    await this.StreamModel.updateMany(
      { isStreaming: true, performerId: sourceId },
      { $set: { isStreaming: false, lastStreamingTime: new Date() } }
    );
  }
}
