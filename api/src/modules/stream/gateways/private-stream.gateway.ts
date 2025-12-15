import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { forwardRef, Inject } from '@nestjs/common';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { AuthService } from 'src/modules/auth/services';
import { Socket } from 'socket.io';
import { Model } from 'mongoose';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { ConversationService } from 'src/modules/message/services';
import { InjectModel } from '@nestjs/mongoose';
import { DBLoggerService } from 'src/modules/logger';
import { PerformerService } from 'src/modules/performer/services';
import { BroadcastStatus } from '../constant';
import { RequestService } from '../services';
import { Stream } from '../schemas';

const STREAM_JOINED = 'private-stream/streamJoined';
const STREAM_INFORMATION_CHANGED = 'private-stream/streamInformationChanged';

@WebSocketGateway()
export class PrivateStreamWsGateway {
  constructor(
    @InjectModel(Stream.name) private readonly StreamModel: Model<Stream>,
    private readonly socketUserService: SocketUserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly requestService: RequestService,
    private readonly conversationService: ConversationService,
    private readonly logger: DBLoggerService,
    private readonly performerService: PerformerService
  ) {}

  @SubscribeMessage('private-stream/join')
  async handleJoinStream(
    client: Socket,
    payload: { conversationId: string; streamId: string }
  ): Promise<void> {
    try {
      const { conversationId, streamId } = payload;
      if (!conversationId) {
        return;
      }

      const { token } = client.handshake.query;
      if (!token) {
        return;
      }

      const [user, conversation] = await Promise.all([
        this.authService.getSourceFromJWT(token as string),
        this.conversationService.findById(conversationId)
      ]);

      if (!user || !conversation) {
        return;
      }

      await this.StreamModel.updateOne(
        { _id: conversation.streamId },
        {
          $addToSet: {
            streamIds: streamId
          }
        }
      );

      const resp = await this.requestService.getBroadcast(streamId);
      if (resp.status) {
        throw resp.error || resp.data;
      }

      if (
        [BroadcastStatus.CREATED, BroadcastStatus.BROADCASTING].includes(
          resp.data.status
        )
      ) {
        const roomName = this.conversationService.serializeConversation(
          conversationId,
          conversation.type
        );
        await this.socketUserService.emitToRoom(roomName, STREAM_JOINED, {
          streamId,
          conversationId,
          user: {
            ...user.toPrivateRequestResponse(),
            isPerformer: user.isPerformer
          }
        });
        if (!user.isPerformer && conversation.type === 'stream_private') {
          await this.socketUserService.emitToUsers(
            conversation.performerId,
            'private-chat-request',
            {
              user: user.toPrivateRequestResponse(),
              conversationId,
              streamId: conversation.streamId,
              id: streamId
            }
          );
        }
        await this.socketUserService.addConnectionToRoom(
          roomName,
          user._id,
          user.isPerformer ? 'model' : 'member'
        );
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
        if (memberIds.length) {
          const members = await this.userService.findByIds(memberIds);

          const ranks = [];
          // eslint-disable-next-line no-restricted-syntax
          for (const m of members) {
            // eslint-disable-next-line no-await-in-loop
            const rank = await this.performerService.checkUserRank(
              conversation.performerId,
              m._id
            );
            ranks.push({ ...rank, memberId: m._id });
          }

          const membersWithRanks = members.map((m) => {
            const resultRank = ranks.filter((r) => r.memberId === m._id);
            return {
              ...m,
              memberRank: resultRank
            };
          });

          const data = {
            conversationId,
            total: members.length,
            members: membersWithRanks.map((m) => new UserDto(m).toResponse(true))
          };
          this.socketUserService.emitToRoom(
            roomName,
            STREAM_INFORMATION_CHANGED,
            data
          );
        }
      }
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'PrivateStreamWsGateway' });
    }
  }

  @SubscribeMessage('private-stream/leave')
  async handleLeaveStream(
    client: Socket,
    payload: { conversationId: string; streamId: string }
  ): Promise<void> {
    try {
      const { conversationId, streamId } = payload;
      if (!conversationId) {
        return;
      }

      const { token } = client.handshake.query;
      if (!token) {
        return;
      }

      const [user, conversation] = await Promise.all([
        this.authService.getSourceFromJWT(token as string),
        this.conversationService.findById(conversationId)
      ]);

      if (!user || !conversation) {
        return;
      }

      await this.StreamModel.updateOne(
        { _id: conversation.streamId },
        {
          $pull: {
            streamIds: streamId
          }
        }
      );
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'PrivateStreamWsGateway' });
    }
  }
}
