import {
  BadRequestException, ForbiddenException, Injectable
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { Model } from 'mongoose';
import { plainToClass, plainToInstance } from 'class-transformer';
import { InjectModel } from '@nestjs/mongoose';
import { StreamService } from './stream.service';
import { StreamOfflineException } from '../exceptions';
import { StreamPeekIn } from '../dtos';

@Injectable()
export class StreamPeekInService {
  constructor(
    @InjectModel(StreamPeekIn.name) private readonly streamPeekIn: Model<StreamPeekIn>,

    private readonly performerService: PerformerService,
    private readonly streamService: StreamService
  ) {}

  public findById(id: string | ObjectId) {
    return this.streamPeekIn.findById(id);
  }

  public async request(performerId: string | ObjectId, userId: ObjectId) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();

    if (!performer.enablePeekIn || performer.streamingStatus !== 'private') {
      throw new BadRequestException();
    }

    const stream = await this.streamService.findByPerformerId(performerId, {
      isStreaming: true,
      type: 'private'
    });
    if (!stream) throw new StreamOfflineException();

    const request = await this.streamPeekIn.create({
      performerId: performer._id,
      userId,
      streamId: stream._id,
      streamType: stream.type,
      token: performer.peekInPrice,
      timeLimit: performer.peekInTimeLimit
    });

    return plainToInstance(StreamPeekIn, request.toObject());
  }

  public async getDetails(id: string | ObjectId, userId: ObjectId) {
    const request = await this.streamPeekIn.findById(id).lean();
    if (!request) throw new EntityNotFoundException();

    if (!request.userId.equals(userId)) throw new ForbiddenException();

    const stream = await this.streamService.findById(request.streamId);
    if (!stream.isStreaming) throw new StreamOfflineException();

    const performer = await this.performerService.findById(request.performerId);
    if (!performer.enablePeekIn || performer.streamingStatus !== 'private') {
      throw new BadRequestException();
    }

    return plainToClass(StreamPeekIn, { ...request, performerInfo: { username: performer.username } });
  }
}
