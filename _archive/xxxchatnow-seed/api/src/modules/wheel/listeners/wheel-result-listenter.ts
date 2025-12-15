import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { WheelResultService } from '../services/wheel-result.service';

const WHEEL_RESULT_LISTENER = 'WHEEL_RESULT_LISTENER';

@Injectable()
export class WheelResultListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly wheelResultService: WheelResultService
  ) {
    this.queueEventService.subscribe(
      'WHEEL_RESULT_CHANNEL',
      WHEEL_RESULT_LISTENER,
      this.handle.bind(this)
    );
  }

  public async handle(event: QueueEvent) {
    try {
      if (![EVENT.CREATED].includes(event.eventName)) {
        return;
      }
    } catch (e) {
      // TODO - log me
      // eslint-disable-next-line no-console
      console.log('error_coupon_used', e);
    }
  }
}
