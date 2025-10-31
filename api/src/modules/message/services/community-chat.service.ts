import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import {
  EntityNotFoundException,
  PageableData
} from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import { PerformerService } from 'src/modules/performer/services';
import { compact, flatten } from 'lodash';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { isObjectId } from 'src/kernel/helpers/string.helper';
import { InjectModel } from '@nestjs/mongoose';
import { CommunityChatPayload, CommunityChatSearchPayload } from '../payloads';
import { CONVERSATION_TYPE } from '../constants';
import { ConversationDto } from '../dtos';
import { GroupNameExistedException } from '../exceptions';
import { Conversation } from '../schemas';

@Injectable()
export class CommunityChatService {
  constructor(
    @InjectModel(Conversation.name) private readonly ConversationModel: Model<Conversation>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) {}

  public async getList(req: CommunityChatSearchPayload, performer: PerformerDto): Promise<PageableData<any>> {
    const query = {} as any;
    query.type = 'performer_community';
    query.performerId = performer._id;

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.ConversationModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.ConversationModel.countDocuments(query)
    ]);

    return {
      data: data.map((g) => new ConversationDto(g)),
      total
    };
  }

  public async getUserList(req: CommunityChatSearchPayload, user: UserDto): Promise<PageableData<any>> {
    const query = {} as FilterQuery<Conversation>;
    query.type = 'performer_community';

    query['recipients.sourceId'] = user._id;

    if (isObjectId(req.performerId)) {
      query.performerId = req.performerId;
    }

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.ConversationModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.ConversationModel.countDocuments(query)
    ]);

    return {
      data: data.map((g) => new ConversationDto(g)),
      total
    };
  }

  public async search(req: CommunityChatSearchPayload): Promise<PageableData<any>> {
    const query = {} as FilterQuery<Conversation>;
    query.type = 'performer_community';

    if (isObjectId(req.performerId)) {
      query.performerId = req.performerId;
    }

    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }

    const [data, total] = await Promise.all([
      this.ConversationModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(Number(req.limit))
        .skip(Number(req.offset)),
      this.ConversationModel.countDocuments(query)
    ]);

    return {
      data: data.map((g) => new ConversationDto(g)),
      total
    };
  }

  public async createGroup(
    payload: CommunityChatPayload,
    performer: PerformerDto
  ): Promise<ConversationDto> {
    const checkTheCommunityGroupName = await this.ConversationModel.countDocuments({
      name: payload.name.trim()
    });

    if (checkTheCommunityGroupName) {
      throw new GroupNameExistedException();
    }

    const conversation = await this.ConversationModel.create({
      type: CONVERSATION_TYPE.PERFORMER_COMMUNITY,
      name: payload.name,
      performerId: performer._id,
      recipients: [
        {
          source: 'performer',
          sourceId: performer._id
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return ConversationDto.fromModel(conversation);
  }

  public async deleteGroup(groupId: ObjectId) {
    const conversation = await this.ConversationModel.findOne({ _id: groupId });
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    await this.ConversationModel.deleteOne({ _id: groupId });
    return true;
  }

  public async getGroupId(groupId: string) {
    const conversation = await this.ConversationModel.findOne({ _id: groupId });
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    // array reduce
    const recipientIds = conversation.recipients
      .slice(0, 100)
      .map((r) => r.sourceId);

    const recipents = [];

    if (recipientIds.length) {
      const performers = await this.performerService.findByIds(recipientIds);
      const users = await this.userService.findByIds(recipientIds);
      recipents.push(compact(performers));
      recipents.push(compact(users));
    }

    const dto = new ConversationDto(conversation);

    if (recipents.length) {
      dto.recipientInfos = recipents.map((recipent) => new UserDto(recipent).toResponse());
    }

    return dto;
  }

  public async joinConversation(id: string, user: any) {
    const conversation = await this.ConversationModel.findOne({ _id: id });
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    await this.ConversationModel.updateOne(
      {
        _id: conversation._id
      },
      {
        $addToSet: {
          recipients: {
            name: user.username,
            source: user.isPerformer ? 'performer' : 'user',
            sourceId: user._id
          }
        }
      }
    );

    return true;
  }

  public async userLeaveTheConversation(id: string, user: any) {
    const conversation = await this.ConversationModel.findOne({ _id: id });
    if (!conversation) {
      throw new EntityNotFoundException();
    }

    await this.ConversationModel.updateOne(
      {
        _id: conversation._id
      },
      {
        $pull: {
          recipients: {
            sourceId: user._id
          }
        }
      }
    );

    return true;
  }

  public async createMessage() {}

  public async createFileMessage() {}

  public async loadMessage() {}

  public async listParticipant(conversationId: string) {
    const conversation = await this.ConversationModel.findOne({ _id: conversationId });
    if (!conversation) {
      return [];
    }

    const recipientIds = conversation.recipients.map((r) => r.sourceId);
    const infos = await Promise.all([
      this.performerService.findByIds(recipientIds),
      this.userService.findByIds(recipientIds)
    ]) as any;

    return compact(flatten(infos)).map((info: any) => new UserDto(info).toResponse());
  }
}
