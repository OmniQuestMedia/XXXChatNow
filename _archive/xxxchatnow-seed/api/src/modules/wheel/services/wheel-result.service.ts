import {
  Injectable,
  Inject,
  forwardRef,
  HttpException,
  ForbiddenException
} from '@nestjs/common';
import {
  QueueEventService,
  QueueEvent,
  EntityNotFoundException
} from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { WheelModel, WheelResultModel } from '../models';

@Injectable()
export class WheelResultService {
  constructor(
    @InjectModel('wheelResult')
    private readonly wheelResultModel: Model<WheelResultModel>,
    @Inject(forwardRef(() => QueueEventService))
    private readonly queueEventService: QueueEventService,
    private readonly userService: UserService,
    @InjectModel('wheelOption')
    private readonly wheelModel: Model<WheelModel>
  ) { }

  public async find(params: any): Promise<WheelResultModel[]> {
    return this.wheelResultModel.find(params);
  }

  public async findById(id: string | ObjectId): Promise<WheelResultModel> {
    return this.wheelResultModel.findOne({ _id: id });
  }

  public async create(
    payload: {
      performerId: string | ObjectId,
      streamId: string | ObjectId,
      streamSessionId: string | ObjectId,
      creatorId: string | ObjectId,
      conversationId: string | ObjectId,
      action: string,
      description: string,
      price: number
    }
  ): Promise<WheelResultModel> {
    const data = {
      ...payload,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    const result = await this.wheelResultModel.create(data);

    await this.queueEventService.publish(
      new QueueEvent({
        channel: 'ACCEPT_SPIN_WHEEL_CHANNEL',
        eventName: 'created',
        data: {
          token: result.price,
          userId: result.creatorId,
          performerId: result.performerId,
          conversationId: result.conversationId,
          name: result.action,
          wheelResultId: result._id
        }
      })
    );

    return result;
  }

  public async getResult(performerId): Promise<string> {
    const wheels = await this.wheelModel.find({ performerId });
    if (!wheels.length) throw new Error('no config');

    const n = Math.floor(Math.random() * 100);
    const i = n % wheels.length;

    return wheels[i].description;
  }

  public async updateStatus(
    id: string,
    payload: {
      status?: string,
      chargeStatus?: boolean,
      earnStatus?: boolean
    },
    performer
  ): Promise<WheelResultModel> {
    const result = await this.findById(id);
    if (!result) {
      throw new EntityNotFoundException();
    }
    if (!performer._id.equals(result.performerId)) {
      throw new ForbiddenException();
    }
    if (result.status !== 'created') {
      throw new HttpException('You have accepted/rejected this request', 400);
    }
    payload.status && result.set('status', payload.status);
    result.set('updatedAt', new Date());
    await result.save();

    if (payload.status === 'accepted') {
      await this.queueEventService.publish(
        new QueueEvent({
          channel: 'ACCEPT_SPIN_WHEEL_CHANNEL',
          eventName: 'accepted',
          data: {
            token: result.price,
            userId: result.creatorId,
            performerId: result.performerId,
            conversationId: result.conversationId,
            name: result.action,
            wheelResultId: result._id
          }
        })
      );
    }

    if (payload.status === 'rejected') {
      // refund to user
      await this.userService.increaseBalance(result.creatorId, result.price);
    }

    return result;
  }
}
