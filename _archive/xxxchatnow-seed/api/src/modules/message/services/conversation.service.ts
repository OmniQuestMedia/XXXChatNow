import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { toObjectId } from 'src/kernel/helpers/string.helper';
import { UserService, UserSearchService } from 'src/modules/user/services';
import {
  PerformerService,
  PerformerSearchService
} from 'src/modules/performer/services';
import { StreamDto } from 'src/modules/stream/dtos';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { ConversationSearchPayload } from '../payloads';
import { ConversationDto } from '../dtos';
import { CONVERSATION_TYPE } from '../constants';
import { Conversation, NotificationMessage } from '../schemas';

export interface IRecipient {
  source: string;
  sourceId: ObjectId | string;
}

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name) private readonly ConversationModel: Model<Conversation>,
    @InjectModel(NotificationMessage.name) private readonly NotificationMessageModel: Model<NotificationMessage>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => UserSearchService))
    private readonly userSearchService: UserSearchService,
    @Inject(forwardRef(() => PerformerSearchService))
    private readonly performerSearchService: PerformerSearchService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) { }

  public async find(params: FilterQuery<Conversation>): Promise<ConversationDto[]> {
    const items = await this.ConversationModel.find(params);
    return items.map((item) => plainToInstance(ConversationDto, item.toObject()));
  }

  public async findOne(params: FilterQuery<Conversation>): Promise<ConversationDto> {
    const item = await this.ConversationModel.findOne(params);
    return ConversationDto.fromModel(item);
  }

  public async createPrivateConversation(
    sender: IRecipient,
    receiver: IRecipient
  ): Promise<ConversationDto> {
    let conversation = await this.ConversationModel
      .findOne({
        type: CONVERSATION_TYPE.PRIVATE,
        recipients: {
          $all: [
            {
              source: sender.source,
              sourceId: toObjectId(sender.sourceId)
            },
            {
              source: receiver.source,
              sourceId: receiver.sourceId
            }
          ]
        }
      })
      .lean()
      .exec();
    if (!conversation) {
      conversation = await this.ConversationModel.create({
        type: CONVERSATION_TYPE.PRIVATE,
        recipients: [sender, receiver],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const dto = new ConversationDto(conversation);
    dto.totalNotSeenMessages = 0;
    if (receiver.source === 'performer') {
      const per = await this.performerService.findById(receiver.sourceId);
      dto.setRecipientInfo(per);
    }
    if (receiver.source === 'user') {
      const user = await this.userService.findById(receiver.sourceId);
      dto.setRecipientInfo(user);
    }
    return dto;
  }

  // get all the list
  public async getList(
    req: ConversationSearchPayload,
    sender: IRecipient
  ): Promise<PageableData<any>> {
    let query = {
      recipients: {
        $elemMatch: {
          source: sender.source,
          sourceId: toObjectId(sender.sourceId)
        }
      }
    } as any;
    if (req.keyword) {
      let usersSearch = null;
      // TODO - it is incorrect coding, need to check code!!
      if (sender.source === 'user') {
        usersSearch = await this.performerSearchService.searchByKeyword({ q: req.keyword });
      }
      if (sender.source === 'performer') {
        usersSearch = await this.userSearchService.searchByKeyword({ q: req.keyword });
      }
      const Ids = usersSearch && usersSearch ? usersSearch.map((u) => u._id) : [];
      query = {
        $and: [
          {
            recipients: {
              $elemMatch: {
                source: sender.source === 'user' ? 'performer' : 'user',
                sourceId: { $in: Ids }
              }
            }
          },
          {
            recipients: {
              $elemMatch: {
                source: sender.source,
                sourceId: toObjectId(sender.sourceId)
              }
            }
          }
        ]
      };
    }
    if (req.type) {
      query.type = req.type;
    }
    const [data, total] = await Promise.all([
      this.ConversationModel
        .find(query)
        .lean()
        .sort({ lastMessageCreatedAt: -1, updatedAt: -1 }),
      this.ConversationModel.countDocuments(query)
    ]);

    // find recipient info
    const recipientIds = data.map((c) => {
      const re = c.recipients.find(
        (rep) => rep.sourceId.toString() !== sender.sourceId.toString()
      );
      return re && re.sourceId;
    });
    const conversationIds = data.map((d) => d._id);
    let users = [];
    let performers = [];
    const notifications = conversationIds.length
      ? await this.NotificationMessageModel.find({
        conversationId: { $in: conversationIds }
      })
      : [];
    if (sender.source === 'user') {
      performers = recipientIds.length
        ? await this.performerService.findByIds(recipientIds)
        : [];
    }
    if (sender.source === 'performer') {
      users = recipientIds.length
        ? await this.userService.findByIds(recipientIds)
        : [];
    }

    const conversations = data.map((d) => {
      const conversation = new ConversationDto(d);
      const recipient = conversation.recipients.find(
        (rep) => rep.sourceId.toString() !== sender.sourceId.toString()
      );
      if (recipient) {
        if (users.length) {
          const user = users.find(
            (u) => u._id.toString() === recipient.sourceId.toString()
          );
          conversation.setRecipientInfo(user);
        }
        if (performers.length) {
          const performer = performers.find(
            (p) => p._id.toString() === recipient.sourceId.toString()
          );
          conversation.setRecipientInfo(performer);
        }

        const conversationNotifications = notifications.length
          && notifications.filter(
            (noti) => noti.conversationId.toString() === conversation._id.toString()
          );

        const recipientNoti = conversationNotifications
          && conversationNotifications.find(
            (c) => c.recipientId.toString() === sender.sourceId.toString()
          );
        conversation.totalNotSeenMessages = recipientNoti?.totalNotReadMessage || 0;
      }
      return conversation;
    });

    return {
      data: conversations,
      total
    };
  }

  public async findById(id: string | ObjectId) {
    return this.ConversationModel
      .findOne({
        // type: CONVERSATION_TYPE.PRIVATE,
        _id: id
      })
      .lean()
      .exec();
  }

  public async findByIds(ids: string[] | ObjectId[]): Promise<ConversationDto[]> {
    const items = await this.ConversationModel.find({
      _id: { $in: ids }
    });
    return items.map((item) => ConversationDto.fromModel(item));
  }

  public async findDetail(id: string | ObjectId, sender: IRecipient) {
    const conversation = await this.ConversationModel.findOne({ _id: id });
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    // array reduce
    const recipientIds = conversation.recipients.filter((r) => sender.source !== r.source).map((r) => r.sourceId);
    let recipents = [];
    if (recipientIds.length && sender.source === 'user') {
      recipents = await this.performerService.findByIds(recipientIds);
    }
    if (recipientIds.length && sender.source === 'performer') {
      recipents = await this.userService.findByIds(recipientIds);
    }
    const dto = new ConversationDto(conversation);
    if (recipents.length) {
      dto.setRecipientInfo(recipents[0]);
    }
    return dto;
  }

  public async findPerformerPublicConversation(performerId: string | ObjectId): Promise<ConversationDto> {
    const conversation = await this.ConversationModel
      .findOne({
        type: `stream_${CONVERSATION_TYPE.PUBLIC}`,
        performerId
      });
    return ConversationDto.fromModel(conversation);
  }

  public async createStreamConversation(stream: StreamDto, recipients?: any): Promise<ConversationDto> {
    const conversation = await this.ConversationModel.create({
      streamId: stream._id,
      performerId: stream.performerId ? stream.performerId : null,
      recipients: recipients || [],
      name: `stream_${stream.type}_performerId_${stream.performerId}`,
      type: `stream_${stream.type}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return ConversationDto.fromModel(conversation);
  }

  public async getPrivateConversationByStreamId(streamId: string | ObjectId): Promise<ConversationDto> {
    const conversation = await this.ConversationModel.findOne({ streamId });
    if (!conversation) {
      throw new NotFoundException();
    }
    return ConversationDto.fromModel(conversation);
  }

  public async addRecipient(
    conversationId: string | ObjectId,
    recipient: IRecipient
  ) {
    await this.ConversationModel.updateOne(
      { _id: conversationId },
      { $addToSet: { recipients: recipient } }
    );
  }

  public serializeConversation(id: string | ObjectId, type: string) {
    return `conversation:${type}:${id}`;
  }

  deserializeConversationId(str: string) {
    const strs = str.split(':');
    if (!strs.length) return '';

    return strs[strs.length - 1];
  }
}
