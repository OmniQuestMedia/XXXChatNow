import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private readonly NotificationModel: Model<Notification>

  ) { }

  public async notifyMe(userId: string | ObjectId, performerId: string) {
    const notification = await this.NotificationModel.findOne({ userId, performerId: ObjectId(performerId) });
    if (!notification) {
      await this.NotificationModel.create({ userId, performerId: ObjectId(performerId) });
    }
    return true;
  }

  public async unNofify(id: | ObjectId) {
    const notify = await this.NotificationModel.findById(id) as any;
    if (!notify) {
      throw new NotFoundException();
    }
    await notify.deleteOne();
    return true;
  }

  public async findOne(params) {
    return this.NotificationModel.findOne(params);
  }

  public async find(params) {
    return this.NotificationModel.find(params);
  }
}
