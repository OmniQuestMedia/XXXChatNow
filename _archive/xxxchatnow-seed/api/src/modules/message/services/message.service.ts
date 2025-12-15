/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { QueueEventService, EntityNotFoundException } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { FileDto } from 'src/modules/file';
import { FileService } from 'src/modules/file/services';
import { UserService } from 'src/modules/user/services';
import {
  PerformerBlockSettingService,
  PerformerService
} from 'src/modules/performer/services';
import { FavouriteService } from 'src/modules/favourite/services';
import { PerformerDto } from 'src/modules/performer/dtos';
import { uniq } from 'lodash';
import { Request } from 'express';
import { ROLE } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { MessageCreatePayload } from '../payloads/message-create.payload';
import {
  MESSAGE_PRIVATE_STREAM_CHANNEL,
  MESSAGE_CHANNEL,
  MESSAGE_EVENT,
  CONVERSATION_TYPE
} from '../constants';
import { IRecipient, MessageDto } from '../dtos';
import { ConversationService } from './conversation.service';
import { MessageListRequest } from '../payloads/message-list.payload';
import { Message } from '../schemas';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private readonly MessageModel: Model<Message>,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    private readonly conversationService: ConversationService,
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly favouriteService: FavouriteService,
    private readonly performerBlockSettingService: PerformerBlockSettingService
  ) { }

  public async createStreamMessageFromConversation(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient,
    user: UserDto | PerformerDto,
    req?: Request
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );

    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }

    let userRank = null;

    if (sender.source === 'user') {
      const { performerId } = conversation;
      const blocked = await this.performerBlockSettingService.checkBlockByPerformerId(
        performerId,
        sender.sourceId,
        req
      );

      const rank = await this.performerService.checkUserRank(
        performerId,
        sender.sourceId
      );
      userRank = rank;
      if (blocked) {
        throw new ForbiddenException();
      }
    }

    const message = await this.MessageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();

    const dto = new MessageDto(message);
    dto.setSenderInfo(user);
    dto.senderRank = userRank;
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async createPublicStreamMessageFromConversation(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient,
    user: UserDto | PerformerDto,
    req?: Request
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    let userRank = null;

    if (sender.source === 'user') {
      const { performerId } = conversation;
      const blocked = await this.performerBlockSettingService.checkBlockByPerformerId(
        performerId,
        sender.sourceId,
        req
      );

      const rank = await this.performerService.checkUserRank(
        performerId,
        sender.sourceId
      );
      userRank = rank;
      if (blocked) {
        throw new ForbiddenException();
      }
    }

    const message = await this.MessageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();

    const dto = new MessageDto(message);
    dto.setSenderInfo(user);
    dto.senderRank = userRank;
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async createPrivateFileMessage(
    sender: IRecipient,
    recipient: IRecipient,
    file: FileDto,
    payload: MessageCreatePayload,
    req?: any
  ): Promise<MessageDto> {
    const conversation = await this.conversationService.createPrivateConversation(
      sender,
      recipient
    );
    if (!file) throw new Error('File is valid!');
    if (!file.isImage()) {
      await this.fileService.removeIfNotHaveRef(file._id);
      throw new Error('Invalid image!');
    }

    if (sender.source === 'user') {
      const { performerId } = conversation;
      const blocked = await this.performerBlockSettingService.checkBlockByPerformerId(
        performerId,
        sender.sourceId,
        req
      );
      if (blocked) {
        throw new ForbiddenException();
      }
    }

    const message = await this.MessageModel.create({
      ...payload,
      type: 'photo',
      senderId: sender.sourceId,
      fileId: file._id,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();

    const dto = new MessageDto(message);
    dto.setImage(file);
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async loadMessages(req: MessageListRequest, user: UserDto) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === user._id.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }

    const query = { conversationId: conversation._id };
    const sort: any = {
      [req.sortBy || 'createdAt']: req.sort
    };
    const [data, total] = await Promise.all([
      this.MessageModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.MessageModel.countDocuments(query)
    ]);

    const fileIds = uniq(data.map((d) => d.fileId));
    const userIds = [];
    const performerIds = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const d of data) {
      if (d.senderSource === ROLE.PERFORMER) {
        performerIds.push(d.senderId);
      }
      if (d.senderSource === ROLE.USER) {
        userIds.push(d.senderId);
      }
    }

    const files = await this.fileService.findByIds(fileIds);
    const [users, performers] = await Promise.all([
      userIds.length ? this.userService.findByIds(uniq(userIds)) : [],
      performerIds.length
        ? this.performerService.findByIds(uniq(performerIds))
        : []
    ]);
    const messages = data.map((message) => {
      const dto = plainToInstance(MessageDto, message);
      const file = message.fileId
        && files.find((f) => f._id.toString() === message.fileId.toString());

      const senderInfo = message.senderId
        && (message.senderSource === ROLE.PERFORMER)
        ? performers.find((performer) => performer._id.equals(message.senderId))
        : users.find((u) => u._id.equals(message.senderId));
      dto.setImage(file);
      dto.setSenderInfo(senderInfo);
      return dto;
    });

    return {
      data: messages,
      total
    };
  }

  public async loadPublicMessages(req: MessageListRequest) {
    const conversation = await this.conversationService.findById(
      req.conversationId
    );
    if (!conversation) throw new EntityNotFoundException();

    const sort: any = {
      [req.sortBy || 'createdAt']: req.sort
    };

    const query = { conversationId: conversation._id };
    const [data, total] = await Promise.all([
      this.MessageModel
        .find(query)
        .sort(sort)
        .lean()
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.MessageModel.countDocuments(query)
    ]);

    const senderIds = data.map((d) => d.senderId);
    const [users, performers] = await Promise.all([
      senderIds.length ? this.userService.findByIds(senderIds) : [],
      senderIds.length ? this.performerService.findByIds(senderIds) : []
    ]);

    const ranks = [];
    for (const m of data) {
      // eslint-disable-next-line no-await-in-loop
      const resp = await this.performerService.checkUserRank(performers[0]._id, m.senderId);
      ranks.push({ ...resp, senderId: m.senderId });
    }

    const messages = data.map((message) => {
      let user = null;
      const resultRank = ranks.filter((r) => r.senderId === message.senderId);

      user = users.find((u) => u._id.toString() === message.senderId.toString());
      if (!user) {
        user = performers.find(
          (p) => p._id.toString() === message.senderId.toString()
        );
      }

      return {
        ...message,
        senderInfo:
          user && user.roles && user.roles.includes('user')
            ? new UserDto(user).toResponse(true)
            : new PerformerDto(user).toResponse(),
        senderRank: resultRank[0] || null
      };
    });

    return {
      data: messages,
      total
    };
  }

  public async createPrivateMessageFromConversation(
    conversationId: string | ObjectId,
    payload: MessageCreatePayload,
    sender: IRecipient,
    req?: any
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) throw new EntityNotFoundException();

    const found = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === sender.sourceId.toString()
    );
    if (!found) {
      throw new EntityNotFoundException();
    }

    if (sender.source === 'user') {
      const { performerId } = conversation;
      const blocked = await this.performerBlockSettingService.checkBlockByPerformerId(
        performerId,
        sender.sourceId,
        req
      );
      if (blocked) {
        throw new ForbiddenException();
      }
    }

    const message = await this.MessageModel.create({
      ...payload,
      senderId: sender.sourceId,
      senderSource: sender.source,
      conversationId: conversation._id
    });
    await message.save();

    const dto = new MessageDto(message);
    dto.senderInfo = req?.user?.toResponse();
    await this.queueEventService.publish({
      channel: MESSAGE_CHANNEL,
      eventName: MESSAGE_EVENT.CREATED,
      data: dto
    });
    return dto;
  }

  public async sendMessageToAllFollowers(
    performerId: string | ObjectId,
    payload: MessageCreatePayload
  ) {
    const followerIds = await this.favouriteService.getAllFollowerIdsByPerformerId(
      performerId
    );
    if (!followerIds.length) {
      return false;
    }
    const sender: IRecipient = {
      source: 'performer',
      sourceId: performerId
    };
    const conversations = await Promise.all(
      followerIds.map((id) => this.conversationService.findOne({
        type: CONVERSATION_TYPE.PRIVATE,
        recipients: {
          $all: [
            {
              source: 'user',
              sourceId: id
            },
            sender
          ]
        }
      }))
    );

    const newFolowerIds = followerIds.filter(
      (_, index) => !conversations[index]
    );
    const newConversations = await Promise.all(
      newFolowerIds.map((id) => this.conversationService.createPrivateConversation(
        { sourceId: performerId, source: 'performer' },
        { sourceId: id, source: 'user' }
      ))
    );
    await Promise.all(
      [...newConversations, ...conversations].map(
        (conversation) => conversation
          && this.createPrivateMessageFromConversation(
            conversation._id,
            payload,
            sender
          )
      )
    );
    return true;
  }

  public async deleteMessage(messageId: string, user: UserDto): Promise<MessageDto> {
    const message = await this.MessageModel.findById(messageId);
    if (!message) {
      throw new EntityNotFoundException();
    }
    if (
      user.roles
      && !user.roles.includes('admin')
      && message.senderId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }
    await message.deleteOne();
    const dto = new MessageDto(message);
    // Emit event to user
    await this.queueEventService.publish({
      channel: MESSAGE_PRIVATE_STREAM_CHANNEL,
      eventName: MESSAGE_EVENT.DELETED,
      data: dto
    });
    return dto;
  }

  public async deleteAllMessageInConversation(
    conversationId: string,
    user: UserDto
  ) {
    const conversation = await this.conversationService.findById(
      conversationId
    );
    if (!conversation) throw new EntityNotFoundException();
    if (
      user.roles
      && !user.roles.includes('admin')
      && conversation.performerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException();
    }
    await this.MessageModel.deleteMany({ conversationId: conversation._id });
    return { success: true };
  }
}
