import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { InjectModel } from '@nestjs/mongoose';
import { ConversationService } from './conversation.service';
import { NotificationMessage } from '../schemas';

@Injectable()
export class NotificationMessageService {
  constructor(
    @InjectModel(NotificationMessage.name) private readonly NotificationMessageModel: Model<NotificationMessage>,
    private readonly conversationService: ConversationService,
    private readonly socketUserService: SocketUserService
  ) { }

  public async recipientReadAllMessageInConversation(recipientId: string | ObjectId, conversationId: string | ObjectId): Promise<any> {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      return { ok: false };
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === recipientId.toString()
    );
    if (!found) {
      return { ok: false };
    }

    const notification = await this.NotificationMessageModel.findOne({
      recipientId,
      conversationId
    });
    if (!notification) {
      return { ok: false };
    }
    notification.totalNotReadMessage = 0;
    await notification.save();

    const totalNotReadMessage = await this.NotificationMessageModel.aggregate([
      {
        $match: { recipientId }
      },
      {
        $group: {
          _id: '$conversationId',
          total: {
            $sum: '$totalNotReadMessage'
          }
        }
      }
    ]);
    let total = 0;
    totalNotReadMessage && totalNotReadMessage.length && totalNotReadMessage.forEach((data) => {
      if (data.total) {
        total += data.total;
      }
    });
    this.socketUserService.emitToUsers([recipientId] as any, 'nofify_read_messages_in_conversation', { total });
    return { ok: true };
  }

  public async countTotalNotReadMessage(user: UserDto): Promise<any> {
    const totalNotReadMessage = await this.NotificationMessageModel.aggregate([
      {
        $match: { recipientId: user._id }
      },
      {
        $group: {
          _id: '$conversationId',
          total: {
            $sum: '$totalNotReadMessage'
          }
        }
      }
    ]);
    let total = 0;
    if (!totalNotReadMessage || !totalNotReadMessage.length) {
      return { total };
    }
    totalNotReadMessage.forEach((data) => {
      if (data.total) {
        total += data.total;
      }
    });
    return { total };
  }
}
