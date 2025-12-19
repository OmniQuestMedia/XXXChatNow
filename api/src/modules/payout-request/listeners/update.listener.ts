import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { MailerService } from 'src/modules/mailer';
import { EarningService } from 'src/modules/earning/services/earning.service';
import { StudioService } from 'src/modules/studio/services';
import { DBLoggerService } from 'src/modules/logger';
import { PayoutRequestDto } from '../dtos/payout-request.dto';
import {
  PAYOUT_REQUEST_CHANEL,
  PAYOUT_REQUEST_EVENT,
  STATUES
} from '../constants';

const PAYOUT_REQUEST_UPDATE = 'PAYOUT_REQUEST_UPDATE';

@Injectable()
export class UpdatePayoutRequestListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly mailService: MailerService,
    private readonly earningService: EarningService,
    private readonly performerService: PerformerService,
    private readonly studioService: StudioService,
    private readonly logger: DBLoggerService
  ) {
    this.queueEventService.subscribe(
      PAYOUT_REQUEST_CHANEL,
      PAYOUT_REQUEST_UPDATE,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    try {
      const request = event.data.request as PayoutRequestDto;
      const { status, sourceId, sourceType } = request;
      if (event.eventName === PAYOUT_REQUEST_EVENT.UPDATED) {
        const source = sourceType === 'performer' ? await this.performerService.findById(sourceId) : await this.studioService.findById(sourceId);
        if (!source) return;

        if (status === STATUES.DONE && event.data.oldStatus !== STATUES.DONE) {
          const payload = { targetId: sourceId, fromDate: request.fromDate, toDate: request.toDate };
          await this.earningService.updatePaidStatus(payload);

          if (request.studioRequestId) {
            await this.earningService.updateRefItemsStudioToModel(request, STATUES.DONE);
          }
        } else if (status === STATUES.REJECTED && event.data.oldStatus !== STATUES.DONE) {
          const payload = { targetId: sourceId, fromDate: request.fromDate, toDate: request.toDate };
          await this.earningService.updateRejectStatus(payload);

          if (request.studioRequestId) {
            await this.earningService.updateRefItemsStudioToModel(request, STATUES.REJECTED);
          }
        } else if (status === STATUES.APPROVED && event.data.oldStatus !== STATUES.APPROVED) {
          const payload = { targetId: sourceId, fromDate: request.fromDate, toDate: request.toDate };
          await this.earningService.updateApprovedStatus(payload);

          if (request.studioRequestId) {
            await this.earningService.updateRefItemsStudioToModel(request, STATUES.APPROVED);
          }
        }

        if (source.email) {
          await this.mailService.send({
            subject: 'Update payout request',
            to: source.email,
            data: { request },
            template: 'payout-request-update'
          });
        }
      }
    } catch (err) {
      this.logger.error(err.stack || err, { context: 'UpdatePayoutRequestListener' });
    }
  }
}
