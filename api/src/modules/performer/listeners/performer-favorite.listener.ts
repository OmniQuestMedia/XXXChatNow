import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  PERFORMER_FAVORITE_CHANNEL
} from 'src/modules/favourite/constants';
import { Model } from 'mongoose';
import { EVENT } from 'src/kernel/constants';
import { InjectModel } from '@nestjs/mongoose';
import { DBLoggerService } from 'src/modules/logger';
import { Performer } from '../schemas';

const HANDLE_FAVORITE_FOR_PERFORMER = 'HANDLE_FAVORITE_FOR_PERFORMER';

@Injectable()
export class PerformerFavoriteListener {
  constructor(
    @InjectModel(Performer.name) private readonly PerformerModel: Model<Performer>,
    private readonly queueEventService: QueueEventService,
    private readonly logger: DBLoggerService
  ) {
    this.queueEventService.subscribe(
      PERFORMER_FAVORITE_CHANNEL,
      HANDLE_FAVORITE_FOR_PERFORMER,
      this.handleFavorite.bind(this)
    );
  }

  public async handleFavorite(event: QueueEvent) {
    try {
      const { eventName } = event;
      if (![EVENT.CREATED, EVENT.DELETED].includes(eventName)) {
        return;
      }
      const { performerId } = event.data;
      const increase = eventName === EVENT.CREATED ? 1 : -1;
      await this.PerformerModel.updateOne(
        { _id: performerId },
        {
          $inc: {
            'stats.favorites': increase
          }
        }
      );
    } catch (e) {
      this.logger.error(e.stack || e, {
        context: 'PerformerFavoriteListener'
      });
    }
  }
}
