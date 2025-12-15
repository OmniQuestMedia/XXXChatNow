import { Injectable, Logger } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { FavouriteService } from 'src/modules/favourite/services';
import { UserService } from 'src/modules/user/services';
import { MailerService } from 'src/modules/mailer';
import { PerformerDto } from 'src/modules/performer/dtos';
import * as moment from 'moment';
import { PerformerScheduleDto } from '../dtos';

export const PERFORMER_SCHEDULE_UPDATE = 'PERFORMER_SCHEDULE_UPDATE';

@Injectable()
export class PerformerScheduleUpdateListener {
    private logger = new Logger(PerformerScheduleUpdateListener.name);

    constructor(
        private readonly quequeServie: QueueEventService,
        private readonly favouriteService: FavouriteService,
        private readonly userService: UserService,
        private readonly mailService: MailerService
    ) {
      this.quequeServie.subscribe(
        'PERFORMER_SCHEDULE_CHANNEL',
        PERFORMER_SCHEDULE_UPDATE,
        this.handler.bind(this)
      );
    }

    async handler(event: QueueEvent) {
      try {
        if (event.eventName !== EVENT.CREATED) return;

        const performerSchedule = event.data.schedule as PerformerScheduleDto;
        const per = event.data.performer as PerformerDto;

        const userIds = await this.favouriteService.getAllFollowerIdsByPerformerId(performerSchedule.performerId);
        if (!userIds.length) return;

        const users = await this.userService.findByIds(userIds);

        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
          if (user.email) {
            // eslint-disable-next-line no-await-in-loop
            await this.mailService.send({
              subject: 'Model update new live stream schedule',
              to: user.email,
              data: {
                username: user.username,
                model: per.username,
                startAt: moment(performerSchedule.startAt).format('MM/DD/YYYY HH:mm'),
                endAt: moment(performerSchedule.endAt).format('MM/DD/YYYY HH:mm'),
                performerSchedule
              },
              template: 'model-add-new-stream-schedule'
            });
          }
        }
      } catch (e) {
        this.logger.error(e);
      }
    }
}
