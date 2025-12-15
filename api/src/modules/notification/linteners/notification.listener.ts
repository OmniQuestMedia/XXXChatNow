/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-shadow */
import { Injectable } from '@nestjs/common';
import {
  QueueEventService,
  QueueEvent
} from 'src/kernel';
import { MailerService } from 'src/modules/mailer';
import { UserService } from 'src/modules/user/services';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from '../schemas/notification.schema';

const NOTIFY_USER_MODEL_STREAMING = 'NOTIFY_USER_MODEL_STREAMING';
const NOTIFICATION_CHANNEL = 'NOTIFICATION_CHANNEL';

@Injectable()
export class NotificationListener {
  constructor(
    @InjectModel(Notification.name) private readonly NotificationModel: Model<Notification>,
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    private readonly userService: UserService
  ) {
    this.queueEventService.subscribe(
      NOTIFICATION_CHANNEL,
      NOTIFY_USER_MODEL_STREAMING,
      this.handleListenNotify.bind(this)
    );
  }

  public async handleListenNotify(event: QueueEvent) {
    const { performer } = event.data;

    const notifications = await this.NotificationModel.find({ performerId: performer._id }) as any;

    for (const notify of notifications) {
      const user = await this.userService.findById(notify.userId);
      await this.mailService.send({
        subject: 'Model streaming',
        to: user.email,
        data: {
          username: user.username,
          modelName: performer.username
        },
        template: 'favorite-model-streaming'
      });
    }
  }
}
