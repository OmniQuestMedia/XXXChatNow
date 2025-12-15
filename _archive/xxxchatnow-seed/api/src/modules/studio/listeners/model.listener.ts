import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { SettingService } from 'src/modules/settings';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { InjectModel } from '@nestjs/mongoose';
import { DBLoggerService } from 'src/modules/logger';
import { STUDIO_CHANNEL, STUDIO_EVENT_NAME } from '../constants';
import { StudioService } from '../services';
import { Studio } from '../schemas';

@Injectable()
export class ModelListener {
  constructor(
    @InjectModel(Studio.name) private readonly StudioModel: Model<Studio>,
    private readonly studioService: StudioService,
    private readonly queueEventService: QueueEventService,
    private readonly logger: DBLoggerService
  ) {
    this.queueEventService.subscribe(
      STUDIO_CHANNEL,
      'STUDIO_CREATED',
      this.createStudioHandler.bind(this)
    );
  }

  async createStudioHandler(event: QueueEvent) {
    try {
      if (event.eventName !== STUDIO_EVENT_NAME.CREATED) return;

      const { data } = event;
      const studio = await this.studioService.findById(data._id);
      if (!studio) return;

      const defaultStudioCommission = SettingService.getValueByKey(SETTING_KEYS.STUDIO_COMMISSION);
      studio.commission = defaultStudioCommission || parseInt(process.env.COMMISSION_RATE, 10);
      await this.StudioModel.updateOne(
        { _id: data._id },
        { $set: { defaultStudioCommission } }
      );
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'ModelListener' });
    }
  }
}
