import { Injectable, Logger } from '@nestjs/common';
import { QueueEventService, QueueEvent, AgendaService } from 'src/kernel';
import * as moment from 'moment';
import { EVENT } from 'src/kernel/constants';
import { PurchaseItemService } from 'src/modules/purchased-item/services';
import { FEATURED_CREATOR_BOOKING_CHANNEL } from '../constants';
import { FeaturedCreatorApprovedService } from '../services';

const UPDATE_FEATURED_CREATOR_BOOKING_STATUS = 'UPDATE_FEATURED_CREATOR_BOOKING_STATUS';

@Injectable()
export class UpdateFeaturedCreatorBookingStatus {
  private readonly logger = new Logger('UpdateFeaturedCreatorBookingStatus');

  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly featuredCreatorApprovedService: FeaturedCreatorApprovedService,
    private readonly agendaService: AgendaService,
    private readonly paymentService: PurchaseItemService

  ) {
    this.queueEventService.subscribe(
      FEATURED_CREATOR_BOOKING_CHANNEL,
      UPDATE_FEATURED_CREATOR_BOOKING_STATUS,
      this.handler.bind(this)
    );
  }

  public async handler(event: QueueEvent) {
    const { eventName, data } = event;
    try {
      if (![EVENT.UPDATED].includes(eventName)) {
        return;
      }

      await this.paymentService.payForFeaturedCreator(data);

      await this.featuredCreatorApprovedService.create(data);

      await this.agendaService.schedule(moment().add(24, 'hours').toDate(), 'FEATURED_CREATOR_PAYMENT_DAILY_SCHEDULE', {});
    } catch (error) {
      this.logger.error(error);
    }
  }
}
