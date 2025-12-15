import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { PerformerService } from 'src/modules/performer/services';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from 'src/modules/message/services';
import { UserDto } from 'src/modules/user/dtos';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { RequestService } from './request.service';
import { SocketUserService } from '../../socket/services/socket-user.service';
import {
  PRIVATE_CHAT,
  GROUP_CHAT,
  PUBLIC_CHAT,
  defaultStreamValue,
  BroadcastType,
  BroadcastStatus
} from '../constant';
import { StreamDto } from '../dtos';
import {
  StreamOfflineException,
  ParticipantJoinLimitException,
  StreamServerErrorException,
  NotEnoughTierLimitExeption
} from '../exceptions';
import { TokenNotEnoughException } from '../exceptions/token-not-enough';
import { TokenCreatePayload } from '../payloads';
import { Stream } from '../schemas';

@Injectable()
export class StreamService {
  constructor(
    @InjectModel(Stream.name) private readonly StreamModel: Model<Stream>,

    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    private readonly conversationService: ConversationService,
    private readonly socketUserService: SocketUserService,
    private readonly requestService: RequestService
  ) { }

  public async findById(id: string | ObjectId): Promise<StreamDto> {
    const stream = await this.StreamModel.findOne({ _id: id });
    return StreamDto.fromModel(stream);
  }

  public async findBySessionId(sessionId: string): Promise<StreamDto> {
    const stream = await this.StreamModel.findOne({ sessionId });
    if (!stream) {
      throw new EntityNotFoundException();
    }

    return StreamDto.fromModel(stream);
  }

  public async findByPerformerId(performerId: string | ObjectId, payload: FilterQuery<Stream> = {}): Promise<StreamDto> {
    const stream = await this.StreamModel.findOne({ performerId, ...payload });
    return StreamDto.fromModel(stream);
  }

  public async getSessionId(
    performerId: string | ObjectId,
    type: string
  ): Promise<string> {
    let stream = await this.StreamModel.findOne({ performerId, type });
    if (!stream) {
      const data: Record<string, any> = {
        sessionId: uuidv4(),
        performerId,
        type
      };
      stream = await this.StreamModel.create(data);
    }

    return stream.sessionId;
  }

  public async create(payload: {
    sessionId: string;
    performerId: string | ObjectId;
    type: string;
  }) {
    const model = await this.StreamModel.create(payload);
    return StreamDto.fromModel(model);
  }

  public async goLive(performerId: ObjectId) {
    let stream = await this.StreamModel.findOne({
      performerId,
      type: PUBLIC_CHAT
    });

    if (!stream) {
      const data: Record<string, any> = {
        sessionId: uuidv4(),
        performerId,
        type: PUBLIC_CHAT
      };
      stream = await this.StreamModel.create(data);
    }

    const dto = StreamDto.fromModel(stream);
    let conversation = await this.conversationService.findOne({
      type: 'stream_public',
      performerId
    });
    if (!conversation) {
      conversation = await this.conversationService.createStreamConversation(dto);
    }

    const data = {
      ...defaultStreamValue,
      streamId: stream._id,
      name: stream._id,
      category: PUBLIC_CHAT,
      description: 'Live Chat',
      type: BroadcastType.LiveStream,
      status: 'finished',
      listenerHookURL: new URL(
        'streaming/antmedia/callback',
        process.env.BASE_URL
      ),
      // listenerHookURL: 'https://webhook.site/a77287ea-4b33-4d8f-9986-d40ac4b1627f',
      metaData: JSON.stringify({
        publisher: performerId.toString(),
        streamId: stream._id,
        conversationId: conversation._id
      })
    };

    const result = await this.requestService.create(data);
    if (result.status) {
      throw new StreamServerErrorException({
        message: result.data?.data?.message,
        error: result.data,
        status: result.data?.status
      });
    }

    return { conversation, sessionId: stream._id };
  }

  public async joinPublicChat(performerId: string | ObjectId, currentUser?: UserDto) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    const stream = await this.StreamModel.findOne({
      performerId,
      type: PUBLIC_CHAT
    });

    if (!stream) {
      throw new EntityNotFoundException();
    }

    if ((performer.badgingTierToken > 0 && !currentUser) || (performer.badgingTierToken > 0 && currentUser && currentUser.stats.totalTokenSpent < performer.badgingTierToken)) {
      throw new NotEnoughTierLimitExeption();
    }

    if (!stream.isStreaming) {
      throw new StreamOfflineException();
    }

    return { sessionId: stream._id };
  }

  public async requestPrivateChat(
    user: UserDto,
    performerId: string | ObjectId
  ) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();

    if (user.balance < performer.privateCallPrice) {
      throw new TokenNotEnoughException();
    }

    const data: Record<string, any> = {
      sessionId: uuidv4(),
      performerId,
      userIds: [user._id],
      type: PRIVATE_CHAT,
      isStreaming: true
    };
    const stream = await this.StreamModel.create(data);
    const recipients = [
      { source: 'performer', sourceId: new ObjectId(performerId) },
      { source: 'user', sourceId: user._id }
    ];
    const conversation = await this.conversationService.createStreamConversation(
      new StreamDto(stream),
      recipients
    );

    return { conversation, sessionId: stream.sessionId };
  }

  public async accpetPrivateChat(id: string, performerId: ObjectId) {
    const conversation = await this.conversationService.findById(id);
    if (!conversation) throw new EntityNotFoundException();

    const recipent = conversation.recipients.find(
      (r) => r.sourceId.toString() === performerId.toString()
        && r.source === 'performer'
    );
    if (!recipent) throw new ForbiddenException();

    const stream = await this.findById(conversation.streamId);
    if (!stream && stream.performerId !== performerId) throw new EntityNotFoundException();
    if (!stream.isStreaming) throw new StreamOfflineException();

    return { conversation, sessionId: stream.sessionId };
  }

  public async startGroupChat(performerId: ObjectId) {
    await this.StreamModel.updateMany({
      performerId,
      type: GROUP_CHAT,
      isStreaming: true
    }, {
      $set: {
        isStreaming: false
      }
    });

    const data: Record<string, any> = {
      sessionId: uuidv4(),
      performerId,
      userIds: [],
      type: GROUP_CHAT,
      isStreaming: true
    };
    const stream = await this.StreamModel.create(data);
    const recipients = [{ source: 'performer', sourceId: performerId }];
    const conversation = await this.conversationService.createStreamConversation(
      new StreamDto(stream),
      recipients
    );

    return { conversation, sessionId: stream.sessionId };
  }

  public async joinGroupChat(performerId: string, user: UserDto) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();
    if (user.balance < performer.groupCallPrice) throw new TokenNotEnoughException();

    const stream = await this.StreamModel.findOne({
      performerId,
      type: GROUP_CHAT,
      isStreaming: true
    });

    if (!stream || (stream && !stream.isStreaming)) {
      throw new StreamOfflineException('Model is not available in Group chat');
    }

    const conversation = await this.conversationService.findOne({
      streamId: stream._id
    });
    if (!conversation) throw new EntityNotFoundException();

    const numberOfParticipant = conversation.recipients.length - 1;
    const { maxParticipantsAllowed } = performer;
    if (
      maxParticipantsAllowed
      && numberOfParticipant > maxParticipantsAllowed
    ) {
      throw new ParticipantJoinLimitException();
    }

    const streamId = `${stream.type}-${stream._id}-${performerId}`;
    const result = await this.requestService.getBroadcast(streamId);
    if (result.status) {
      throw new StreamServerErrorException({
        message: result.data?.data?.message,
        error: result.data,
        status: result.data?.status
      });
    }

    if (result.data.status !== BroadcastStatus.BROADCASTING) throw new StreamOfflineException();

    if (result.data.startTime > 0 && moment(result.data.startTime).add(15, 'seconds').isAfter(moment())) throw new StreamOfflineException();

    const roomName = this.conversationService.serializeConversation(
      conversation._id,
      conversation.type
    );
    const connection = await this.socketUserService.getConnectionValue(roomName, user._id.toString());
    if (connection) {
      throw new BadRequestException('Please wait a moment before starting join');
    }
    // const event: QueueEvent = {
    //   channel: LIVE_STREAM_CHANNEL,
    //   eventName: LIVE_STREAM_EVENT_NAME.CONNECTED,
    //   data: stream
    // };
    // this.queueEventService.publish(event);
    const joinedTheRoom = conversation.recipients.find(
      (recipient) => recipient.sourceId.toString() === user._id.toString()
    );
    if (!joinedTheRoom) {
      const recipient = {
        source: 'user',
        sourceId: user._id
      };
      await this.conversationService.addRecipient(conversation._id, recipient);
    }

    return { conversation, sessionId: stream.sessionId };
  }

  public async getOneTimeToken(payload: TokenCreatePayload, userId: string) {
    const { id } = payload;
    let streamId = id;
    if (id.indexOf(PRIVATE_CHAT) === 0 || id.indexOf('group') === 0) {
      [, streamId] = id.split('-');
    }

    const [stream, conversation] = await Promise.all([
      this.StreamModel.findOne({ _id: streamId }),
      this.conversationService.findOne({ streamId })
    ]);

    if (!stream || !conversation) {
      throw new EntityNotFoundException();
    }

    const roomId = this.conversationService.serializeConversation(
      conversation._id,
      conversation.type
    );
    const connections = await this.socketUserService.getRoomUserConnections(roomId);
    const memberIds: string[] = [];
    Object.keys(connections).forEach((v) => {
      memberIds.push(v);
    });

    if (!memberIds.includes(userId)) {
      throw new ForbiddenException();
    }

    const resp = await this.requestService.generateOneTimeToken(id, payload);
    return resp.data;
  }

  public async getStream(streamId: string) {
    try {
      const result = await this.requestService.getBroadcastResponse(streamId);
      return result;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  public getPublicStream(performerId: string) {
    return this.StreamModel.findOne({ isStreaming: true, performerId });
  }
}
