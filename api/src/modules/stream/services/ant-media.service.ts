import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { ConversationService } from 'src/modules/message/services';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { UserService } from 'src/modules/user/services';
import { UserDto } from 'src/modules/user/dtos';
import { InjectModel } from '@nestjs/mongoose';
import { PerformerService } from 'src/modules/performer/services';
import * as moment from 'moment';
import {
  GROUP_CHAT,
  PRIVATE_CHAT,
  PUBLIC_CHAT,
  STREAM_INFORMATION_CHANGED,
  STREAM_LEFT
} from '../constant';
import { RequestService } from './request.service';
import { Stream } from '../schemas';

@Injectable()
export class AntMediaService {
  private readonly logger = new Logger();

  constructor(
    @InjectModel(Stream.name) private readonly StreamModel: Model<Stream>,
    private readonly conversationService: ConversationService,
    private readonly requestService: RequestService,
    private readonly socketUserService: SocketUserService,
    private readonly userService: UserService,
    private readonly performerService: PerformerService
  ) { }

  public async callback(payload: Record<string, any>) {
    try {
      const { id, action, category } = payload;
      const response = await this.requestService.getBroadcast(id);
      if (response.status) {
        return;
      }

      if (!response.data.metaData) return;

      const metadata = JSON.parse(response.data.metaData);
      // const { conversationId, streamId, performerId } = metadata;
      const { conversationId, streamId, publisher } = metadata;

      const [conversation, stream] = await Promise.all([
        this.conversationService.findById(conversationId),
        this.StreamModel.findById(streamId)
      ]);
      if (!conversation || !stream) {
        return;
      }

      const roomName = this.conversationService.serializeConversation(
        conversationId,
        conversation.type
      );

      if (action === 'liveStreamStarted') {
        stream.performerId.equals(publisher) && await this.StreamModel.updateOne(
          { _id: streamId },
          { $set: { isStreaming: true, updatedAt: new Date() } }
        );
        if (category === PUBLIC_CHAT) {
          await Promise.all([
            this.performerService.goLive(publisher),
            this.performerService.setStreamingStatus(
              publisher,
              PUBLIC_CHAT
            )
          ]);
          await this.socketUserService.emitToRoom(
            roomName,
            'join-broadcaster',
            {
              performerId: publisher
            }
          );
        } else if (category === PRIVATE_CHAT) {
          //   this.socketUserService.emitToUsers(uId, 'liveStreamStarted', {
          //     conversationId: conversation._id,
          //     streamId: id
          //   });
          // } else if (category === GROUP_CHAT) {
          //   this.socketUserService.emitToUsers(uId, 'liveStreamStarted', {
          //     conversationId: conversation._id,
          //     streamId: id
          //   });
          // }
        }
      } else if (action === 'liveStreamEnded') {
        const updater = {
          $pull: {
            streamIds: id
          }
        } as any;

        // model left stream
        if (stream.performerId.equals(publisher)) {
          updater.$set = {
            isStreaming: false,
            lastStreamingTime: new Date(),
            updatedAt: new Date()
          };
        }

        await this.StreamModel.updateOne(
          { _id: streamId },
          updater
        );

        await this.socketUserService.emitToRoom(roomName, STREAM_LEFT, {
          streamId: id,
          conversationId
        });

        if (category === PUBLIC_CHAT) {
          await this.socketUserService.emitToRoom(roomName, 'model-left', {
            performerId: publisher
          });
          const { startTime } = response.data;
          if (startTime) {
            const streamTime = moment()
              .toDate()
              .getTime() - startTime;
            this.performerService.updateLastStreamingTime(publisher, streamTime);
          }
        } else if (category === PRIVATE_CHAT) {
          // this.socketUserService.emitToUsers(uId, 'liveStreamEnded', {
          //   conversationId: conversation._id,
          //   streamId: id
          // });
        } else if (category === GROUP_CHAT) {
          // this.socketUserService.emitToUsers(uId, 'liveStreamEnded', {
          //   conversationId: conversation._id,
          //   streamId: id
          // });
          if (stream.performerId.equals(publisher)) {
            await this.socketUserService.emitToRoom(roomName, 'MODEL_LEFT_ROOM', {
              date: new Date(),
              conversationId
            });
          }
          await this.socketUserService.removeConnectionFromRoom(roomName, publisher);
          const connections = await this.socketUserService.getRoomUserConnections(roomName);
          const memberIds: string[] = [];
          Object.keys(connections).forEach((uid) => {
            const value = connections[uid].split(',');
            if (value[0] === 'member') {
              memberIds.push(uid);
            }
          });
          const members = memberIds.length
            ? await this.userService.findByIds(memberIds)
            : [];
          const data = {
            conversationId,
            total: members.length,
            members: members.map((member) => new UserDto(member).toResponse())
          };
          this.socketUserService.emitToRoom(
            roomName,
            STREAM_INFORMATION_CHANGED,
            data
          );
        }
      }
    } catch (e) {
      this.logger.error('Handle Data Callback', e);
    }
  }
}
