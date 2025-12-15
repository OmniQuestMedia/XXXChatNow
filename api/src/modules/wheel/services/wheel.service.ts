import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException
} from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDto } from 'src/modules/user/dtos';
import { InjectModel } from '@nestjs/mongoose';
import { WheelCreatePayload, WheelUpdatePayload } from '../payloads';
import { WheelModel } from '../models';

@Injectable()
export class WheelService {
  constructor(
    @InjectModel('wheelOption')
    private readonly wheelModel: Model<WheelModel>
  ) { }

  public async find(params: any): Promise<WheelModel[]> {
    return this.wheelModel.find(params);
  }

  public async findById(id: string | ObjectId): Promise<WheelModel> {
    return this.wheelModel.findOne({ _id: id });
  }

  public async create(
    payload: WheelCreatePayload,
    user: UserDto
  ): Promise<WheelModel> {
    const total = await this.wheelModel.countDocuments({ performerId: user._id });
    if (total >= 7) {
      throw new HttpException('You can not create more than 7 options', 400);
    }
    const data = {
      ...payload,
      performerId: user._id,
      updatedAt: new Date(),
      createdAt: new Date()
    };
    const wheel = await this.wheelModel.create(data);

    return wheel;
  }

  public async update(
    id: string,
    payload: WheelUpdatePayload,
    user: UserDto
  ): Promise<WheelModel> {
    const wheel = await this.findById(id);
    if (!wheel) {
      throw new NotFoundException();
    }

    if (!user._id.equals(wheel.performerId)) {
      throw new ForbiddenException();
    }

    if (payload.name) wheel.set('name', payload.name);
    if (payload.description) wheel.set('description', payload.description);
    if (payload.color) wheel.set('color', payload.color);
    if (payload.time) wheel.set('time', payload.time);
    if (payload.status) wheel.set('status', payload.status);
    if (payload.ordering) wheel.set('ordering', payload.ordering);
    wheel.set('updatedAt', new Date());
    await wheel.save();
    return wheel;
  }

  public async delete(id: string, user: UserDto): Promise<boolean> {
    const wheel = await this.findById(id);
    if (!wheel) {
      throw new NotFoundException();
    }
    if (!user._id.equals(wheel.performerId)) {
      throw new ForbiddenException();
    }
    await wheel.deleteOne();
    return true;
  }
}
