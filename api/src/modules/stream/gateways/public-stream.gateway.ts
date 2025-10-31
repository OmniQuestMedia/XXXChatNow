import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from 'src/modules/auth/services';
import { StreamService } from 'src/modules/stream/services';
import { PUBLIC_CHAT } from 'src/modules/stream/constant';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import * as moment from 'moment';
import { PerformerService } from 'src/modules/performer/services';
import { ConversationService } from 'src/modules/message/services';
import { IAuthPayload } from 'src/modules/auth/interfaces';
import { InjectModel } from '@nestjs/mongoose';
import { Stream } from '../schemas';

@WebSocketGateway()
export class PublicStreamWsGateway {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Stream.name) private readonly StreamModel: Model<Stream>,
    private readonly authService: AuthService,
    private readonly streamService: StreamService,
    private readonly socketService: SocketUserService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly conversationService: ConversationService
  ) { }

  @SubscribeMessage('public-stream/live')
  async goLive(client: Socket, payload: { conversationId: string }) {
    try {
      const { conversationId } = payload;
      if (!conversationId) {
        return;
      }

      const conversation = await this.conversationService.findById(
        conversationId
      );
      if (!conversation) return;

      const { token } = client.handshake.query;
      if (!token) return;

      const user = await this.authService.getSourceFromJWT(token as string);
      if (!user) return;

      const roomName = this.conversationService.serializeConversation(
        conversation._id,
        conversation.type
      );
      this.socketService.emitToRoom(roomName, 'join-broadcaster', {
        performerId: user._id
      });

      await Promise.all([
        this.performerService.goLive(user._id),
        this.performerService.setStreamingStatus(user._id, PUBLIC_CHAT),
        this.StreamModel.updateOne(
          { _id: conversation.streamId },
          { $set: { isStreaming: true, lastStreamingTime: new Date(), updatedAt: new Date() } }
        )
      ]);
    } catch { } // eslint-disable-line
  }

  @SubscribeMessage('public-stream/join')
  async handleJoinPublicRoom(
    client: Socket,
    payload: { conversationId: string }
  ): Promise<void> {
    try {
      const { token } = client.handshake.query;
      const { conversationId } = payload;
      if (!conversationId) {
        return;
      }

      const conversation = await this.conversationService.findById(
        conversationId
      );
      if (!conversation) {
        return;
      }

      const { performerId, type } = conversation;
      const authUser: IAuthPayload | false = token && (await this.authService.verifyJWT(token as string));
      let user: any; // TODO - convert DTO
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
      const roomName = this.conversationService.serializeConversation(
        conversationId,
        type
      );
      client.join(roomName);
      let role = 'guest';
      if (user) {
        // role = authUser && authUser.source === 'user' ? 'member' : 'model';
        role = conversation.performerId.equals(user._id) ? 'model' : 'member';
        await this.socketService.emitToRoom(
          roomName,
          `message_created_conversation_${conversation._id}`,
          {
            text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has joined this conversation`,
            _id: generateUuid(),
            conversationId: conversation._id,
            isSystem: true
          }
        );
      }

      await this.socketService.addConnectionToRoom(
        roomName,
        user ? user._id : client.id,
        role
      );
      const connections = await this.socketService.getRoomUserConnections(
        roomName
      );
      const memberIds: string[] = [];
      Object.keys(connections).forEach((id) => {
        const value = connections[id].split(',');
        if (value[0] === 'member') {
          memberIds.push(id);
        }
      });

      if (
        memberIds.length
        && role === 'model'
        && `${user._id}` === `${conversation.performerId}`
      ) {
        await this.socketService.emitToUsers(memberIds, 'model-joined', {
          conversationId
        });
      }

      const members = memberIds.length
        ? await this.userService.findByIds(memberIds)
        : [];

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

      const data = {
        total: members.length,
        members: membersWithRanks.map((m) => new UserDto(m).toResponse(true)),
        conversationId
      };
      this.socketService.emitToRoom(roomName, 'public-room-changed', data);

      const stream = await this.streamService.findByPerformerId(performerId, {
        type: PUBLIC_CHAT,
        isStreaming: true
      });

      if (stream) {
        this.socketService.emitToRoom(roomName, 'join-broadcaster', {
          performerId
        });
      }
    } catch { } // eslint-disable-line
  }

  @SubscribeMessage('public-stream/rejoin')
  async handleReJoinPublicRoom(
    client: Socket,
    payload: { conversationId: string }
  ): Promise<void> {
    try {
      const { token } = client.handshake.query;
      const { conversationId } = payload;
      if (!conversationId) {
        return;
      }
      const conversation = await this.conversationService.findById(
        conversationId
      );
      if (!conversation) {
        return;
      }

      const { type } = conversation;
      const authUser: IAuthPayload | false = token && (await this.authService.verifyJWT(token as string));
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
      const roomName = this.conversationService.serializeConversation(
        conversationId,
        type
      );
      if (!client.rooms[roomName]) {
        client.join(roomName);
      }
      let role = 'guest';
      if (user) {
        role = authUser && authUser.source === 'user' ? 'member' : 'model';
        await this.socketService.emitToRoom(
          roomName,
          `message_created_conversation_${conversation._id}`,
          {
            text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has joined this conversation`,
            _id: generateUuid(),
            conversationId: conversation._id,
            isSystem: true
          }
        );
      }

      const connection = await this.socketService.getConnectionValue(
        roomName,
        user ? user._id : client.id
      );
      if (!connection) {
        await this.socketService.addConnectionToRoom(
          roomName,
          user ? user._id : client.id,
          role
        );
      }
      const connections = await this.socketService.getRoomUserConnections(
        roomName
      );
      const memberIds: string[] = [];
      Object.keys(connections).forEach((id) => {
        const value = connections[id].split(',');
        if (value[0] === 'member') {
          memberIds.push(id);
        }
      });

      if (
        memberIds.length
        && role === 'model'
        && `${user._id}` === `${conversation.performerId}`
      ) {
        await this.socketService.emitToUsers(memberIds, 'model-joined', {
          conversationId
        });
      }

      const members = memberIds.length
        ? await this.userService.findByIds(memberIds)
        : [];

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

      const data = {
        total: members.length,
        members: membersWithRanks.map((m) => new UserDto(m).toResponse(true)),
        conversationId
      };
      this.socketService.emitToRoom(roomName, 'public-room-changed', data);
    } catch { } // eslint-disable-line
  }

  @SubscribeMessage('public-stream/leave')
  async handleLeavePublicRoom(
    client: Socket,
    payload: { conversationId: string }
  ): Promise<void> {
    try {
      const { token } = client.handshake.query;
      const { conversationId } = payload;
      if (!conversationId) {
        return;
      }
      const conversation = payload.conversationId
        && (await this.conversationService.findById(conversationId));
      if (!conversation) {
        return;
      }

      const { performerId, type } = conversation;
      const [user, stream] = await Promise.all([
        token && this.authService.getSourceFromJWT(token as string),
        this.streamService.findByPerformerId(performerId, {
          type: PUBLIC_CHAT
        })
      ]);
      const roomName = this.conversationService.serializeConversation(
        conversationId,
        type
      );
      client.leave(roomName);

      if (user) {
        await this.socketService.emitToRoom(
          roomName,
          `message_created_conversation_${conversation._id}`,
          {
            text: `${user.enableGhostMode ? 'Anonymous' : user.username || 'N/A'} has left this conversation`,
            _id: generateUuid(),
            conversationId: payload.conversationId,
            isSystem: true
          }
        );
        const results = await this.socketService.getConnectionValue(
          roomName,
          user._id
        );
        if (results) {
          const values = results.split(',');
          const timeJoined = values[1] ? parseInt(values[1], 10) : null;
          const role = values[0];
          if (timeJoined) {
            const viewTime = moment()
              .toDate()
              .getTime() - timeJoined;
            if (role === 'model' && performerId.equals(user._id)) {
              this.socketService.emitToRoom(roomName, 'model-left', {
                performerId
              });
              stream
                && stream.isStreaming
                && (await Promise.all([
                  this.StreamModel.updateOne(
                    { _id: stream._id },
                    {
                      $set: {
                        lastStreamingTime: new Date(),
                        updatedAt: new Date(),
                        isStreaming: false
                      }
                    }
                  ),
                  this.performerService.updateLastStreamingTime(
                    user._id,
                    moment().diff(moment(stream.lastStreamingTime))
                  )
                ]));
            } else if (role === 'member') {
              await this.userService.updateStats(user._id, {
                'stats.totalViewTime': viewTime
              });
            }
          }
        }
      }

      await this.socketService.removeConnectionFromRoom(
        roomName,
        user ? user._id : client.id
      );

      const connections = await this.socketService.getRoomUserConnections(
        roomName
      );

      const memberIds: string[] = [];
      Object.keys(connections).forEach((id) => {
        const value = connections[id].split(',');
        if (value[0] === 'member') {
          memberIds.push(id);
        }
      });

      const members = memberIds.length
        ? await this.userService.findByIds(memberIds)
        : [];

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

      const data = {
        total: members.length,
        members: membersWithRanks.map((m) => new UserDto(m).toResponse(true)),
        conversationId
      };
      await this.socketService.emitToRoom(
        roomName,
        'public-room-changed',
        data
      );
    } catch (e) {
      // TODO - log me
      this.logger.error(e);
    }
  }
}
