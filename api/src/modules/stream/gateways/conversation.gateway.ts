import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { forwardRef, Inject } from '@nestjs/common';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { RequestService, StreamPeekInService } from 'src/modules/stream/services';
import { AuthService } from 'src/modules/auth/services';
import { ConversationService } from 'src/modules/message/services';
import { Socket } from 'socket.io';
import { Model } from 'mongoose';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerService } from 'src/modules/performer/services';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { InjectModel } from '@nestjs/mongoose';
import { DBLoggerService } from 'src/modules/logger';
import { ConversationDto } from 'src/modules/message/dtos';
import { plainToInstance } from 'class-transformer';
import { PaymentTokenService } from 'src/modules/purchased-item/services';
import {
  PRIVATE_CHAT,
  defaultStreamValue,
  BroadcastType,
  OFFLINE,
  GROUP_CHAT
} from '../constant';
import { Stream } from '../schemas';

const JOINED_THE_ROOM = 'JOINED_THE_ROOM';
const MODEL_JOIN_ROOM = 'MODEL_JOIN_ROOM';
const MODEL_LEFT_ROOM = 'MODEL_LEFT_ROOM';
const JOIN_ROOM = 'JOIN_ROOM';
const REJOIN_ROOM = 'REJOIN_ROOM';
const LEAVE_ROOM = 'LEAVE_ROOM';
const PEEK_IN = 'PEEK_IN';

@WebSocketGateway()
export class StreamConversationWsGateway {
  constructor(
    @InjectModel(Stream.name) private readonly StreamModel: Model<Stream>,
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly conversationService: ConversationService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly requestService: RequestService,
    private readonly logger: DBLoggerService,
    @Inject(forwardRef(() => PaymentTokenService))
    private readonly paymentTokenService: PaymentTokenService,
    private readonly streamPeekInService: StreamPeekInService
  ) { }

  @SubscribeMessage(JOIN_ROOM)
  async handleJoinPrivateRoom(
    client: Socket,
    payload: { conversationId: string }
  ) {
    try {
      const { conversationId } = payload;
      const { token } = client.handshake.query;
      if (!token) {
        return;
      }

      const [user, conversationModel] = await Promise.all([
        this.authService.getSourceFromJWT(token as string),
        this.conversationService.findById(conversationId)
      ]);

      const conversation = plainToInstance(ConversationDto, conversationModel);

      if (!user || !conversation) {
        return;
      }

      const stream = await this.StreamModel.findOne({
        _id: conversation.streamId
      });
      if (!stream) return;

      const roomName = this.conversationService.serializeConversation(
        conversationId,
        conversation.type
      );
      client.join(roomName);
      await this.socketUserService.emitToRoom(
        roomName,
        `message_created_conversation_${conversation._id}`,
        {
          text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has joined this conversation`,
          _id: generateUuid(),
          conversationId: conversation._id,
          isSystem: true
        }
      );

      if (user.isPerformer && `${user._id}` === `${conversation.performerId}`) {
        await this.socketUserService.emitToRoom(roomName, MODEL_JOIN_ROOM, {
          conversationId
        });
        const type = conversation.type.split('_');
        await this.performerService.setStreamingStatus(user._id, type[1]);
      }

      const connections = await this.socketUserService.getRoomUserConnections(
        roomName
      );
      const memberIds: string[] = [];
      Object.keys(connections).forEach((id) => {
        const value = connections[id].split(',');
        if (value[0] === 'member') {
          memberIds.push(id);
        }
      });
      const members = await this.userService.findByIds(memberIds);
      const streamId = user.isPerformer ? `${stream.type}-${stream._id}-${user._id}` : `${stream.type}-${stream._id}-${user._id}-${new Date().getTime()}`;
      const data = {
        ...defaultStreamValue,
        streamId,
        name: streamId,
        description: '',
        type: BroadcastType.LiveStream,
        category: stream.type,
        listenerHookURL: new URL(
          'streaming/antmedia/callback',
          process.env.BASE_URL
        ).href,
        // listenerHookURL: 'https://webhook.site/a77287ea-4b33-4d8f-9986-d40ac4b1627f',
        status: 'finished',
        metaData: JSON.stringify({
          performerId: stream.performerId,
          streamId: stream._id,
          conversationId: conversation._id,
          publisher: user._id
        })
      };
      const result = await this.requestService.create(data);
      if (result.status) {
        throw result.error || result.data;
      }

      const ranks = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const m of members) {
        // eslint-disable-next-line no-await-in-loop
        const resp = await this.performerService.checkUserRank(conversation.performerId, m._id);
        ranks.push({ ...resp, memberId: m._id });
      }

      const membersWithRanks = members.map((m) => {
        const resultRank = ranks.filter((r) => r.memberId === m._id);
        return {
          ...m,
          memberRank: resultRank
        };
      });

      await this.socketUserService.emitToUsers(user._id, JOINED_THE_ROOM, {
        streamId,
        conversationId,
        // total: client.adapter.rooms[roomName]
        //   ? client.adapter.rooms[roomName].length
        //   : 0,
        total: members.length,
        members: membersWithRanks.map((m: any) => ({
          ...new UserDto(m).toResponse(true),
          isPerformer: m.isPerformer
        })),
        streamList: stream.streamIds
      });
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'StreamConversationWsGateway' });
    }
  }

  @SubscribeMessage(PEEK_IN)
  async handlePeekIn(
    client: Socket,
    payload: { id: string }
  ) {
    try {
      const { id } = payload;
      const { token } = client.handshake.query;
      if (!token) {
        return;
      }

      const [user, request] = await Promise.all([
        this.authService.getSourceFromJWT(token as string),
        this.streamPeekInService.findById(id)
      ]);

      if (!user || !request) {
        return;
      }

      const check = await this.paymentTokenService.checkBought(id, user);
      if (!check) return;

      const stream = await this.StreamModel.findById(request.streamId);
      if (!stream) return;

      // eslint-disable-next-line consistent-return
      return {
        streamId: stream.streamIds.find((streamId) => streamId.includes(request.performerId.toString()))
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  @SubscribeMessage(REJOIN_ROOM)
  async handleReJoinPrivateRoom(
    client: Socket,
    payload: { conversationId: string }
  ) {
    try {
      const { conversationId } = payload;
      const { token } = client.handshake.query;
      if (!token) {
        return;
      }

      const [authUser, conversationModel] = await Promise.all([
        this.authService.verifyJWT(token as string),
        this.conversationService.findById(conversationId)
      ]);

      const conversation = plainToInstance(ConversationDto, conversationModel);

      if (!conversation) {
        return;
      }

      let user: any;
      if (authUser) {
        switch (authUser?.source) {
          case 'user':
            user = await this.userService.findById(authUser.sourceId);
            break;
          case 'performer':
            user = await this.performerService.findById(authUser.sourceId);
            break;
          default: break;
        }
      }

      const stream = await this.StreamModel.findOne({
        _id: conversation.streamId
      });
      if (!stream) return;

      const roomName = this.conversationService.serializeConversation(
        conversationId,
        conversation.type
      );

      if (!client.rooms[roomName]) {
        client.join(roomName);
      }

      const connection = await this.socketUserService.getConnectionValue(
        roomName,
        user._id
      );

      if (!connection) {
        this.socketUserService.addConnectionToRoom(
          roomName,
          user._id,
          authUser && authUser.source === 'performer' ? 'model' : 'member'
        );
      }

      await this.socketUserService.emitToRoom(
        roomName,
        `message_created_conversation_${conversation._id}`,
        {
          text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has joined this conversation`,
          _id: generateUuid(),
          conversationId: conversation._id,
          isSystem: true
        }
      );

      if (user.isPerformer && `${user._id}` === `${conversation.performerId}`) {
        await this.socketUserService.emitToRoom(roomName, MODEL_JOIN_ROOM, {
          conversationId
        });
        const type = conversation.type.split('_');
        await this.performerService.setStreamingStatus(user._id, type[1]);
      }

      const connections = await this.socketUserService.getRoomUserConnections(
        roomName
      );
      const memberIds: string[] = [];
      Object.keys(connections).forEach((id) => {
        const value = connections[id].split(',');
        if (value[0] === 'member') {
          memberIds.push(id);
        }
      });
      const members = await this.userService.findByIds(memberIds);

      const ranks = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const m of members) {
        // eslint-disable-next-line no-await-in-loop
        const resp = await this.performerService.checkUserRank(conversation.performerId, m._id);
        ranks.push({ ...resp, memberId: m._id });
      }

      const membersWithRanks = members.map((m) => {
        const resultRank = ranks.filter((r) => r.memberId === m._id);
        return {
          ...m,
          memberRank: resultRank
        };
      });

      await this.socketUserService.emitToUsers(user._id, JOINED_THE_ROOM, {
        conversationId,
        // total: client.adapter.rooms[roomName]
        //   ? client.adapter.rooms[roomName].length
        //   : 0,
        total: members.length,
        members: membersWithRanks.map((m: any) => ({
          ...new UserDto(m).toResponse(true),
          isPerformer: m.isPerformer
        })),
        streamList: stream.streamIds
      });
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'StreamConversationWsGateway' });
    }
  }

  @SubscribeMessage(LEAVE_ROOM)
  async handleLeavePrivateRoom(
    client: Socket,
    payload: { conversationId: string }
  ) {
    try {
      const { conversationId } = payload;
      const { token } = client.handshake.query;
      if (!token) {
        return;
      }

      const [user, conversation] = await Promise.all([
        this.authService.getSourceFromJWT(token as string),
        this.conversationService.findById(payload.conversationId)
      ]);

      if (!user || !conversation) {
        return;
      }

      const stream = await this.StreamModel.findOne({
        _id: conversation.streamId
      });
      if (!stream) return;

      const roomName = this.conversationService.serializeConversation(
        conversationId,
        conversation.type
      );
      client.leave(roomName);
      // await this.socketUserService.removeConnectionFromRoom(roomName, user._id);
      await this.socketUserService.emitToRoom(
        roomName,
        `message_created_conversation_${payload.conversationId}`,
        {
          text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has left this conversation`,
          _id: generateUuid(),
          conversationId: payload.conversationId,
          isSystem: true
        }
      );

      if (user?.isPerformer && `${user._id}` === `${conversation.performerId}`) {
        await this.performerService.setStreamingStatus(user._id, OFFLINE);
        await this.socketUserService.emitToRoom(roomName, MODEL_LEFT_ROOM, {
          date: new Date(),
          conversationId
        });
      }

      if (
        stream.isStreaming
        && (
          // TODO - check me
          // !client.adapter.rooms[roomName] ||
          stream.type === PRIVATE_CHAT
          || (stream.type === GROUP_CHAT && user.isPerformer)
        )
      ) {
        stream.isStreaming = false;
        stream.lastStreamingTime = new Date();
        await stream.save();
      }
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'StreamConversationWsGateway' });
    }
  }
}
