import { Injectable } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { DBLoggerService } from 'src/modules/logger';
import { StudioService } from '../services';

@Injectable()
export class StudioMemberListener {
  constructor(
    private readonly studioService: StudioService,
    private readonly queueEventService: QueueEventService,
    private readonly logger: DBLoggerService
  ) {
    this.queueEventService.subscribe(
      'STUDIO_MEMBER_CHANNEL',
      'STUDIO_CREATE_UPDATE_MEMBER',
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    try {
      if (![EVENT.CREATED, EVENT.UPDATED].includes(event.eventName)) {
        return;
      }

      const { studioId, total } = event.data;
      await this.studioService.increaseStats(studioId, {
        'stats.totalPerformer': total || 1
      });
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'ModelListener' });
    }
  }
}
