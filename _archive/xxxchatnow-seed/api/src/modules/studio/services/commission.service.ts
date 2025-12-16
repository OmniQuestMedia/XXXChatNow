import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  PerformerCommissionDto,
  PerformerDto
} from 'src/modules/performer/dtos';
import { PerformerSearchPayload } from 'src/modules/performer/payloads';
import {
  PerformerCommissionService,
  PerformerSearchService
} from 'src/modules/performer/services';
import { SettingService } from 'src/modules/settings/services';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { Model } from 'mongoose';
import { merge } from 'lodash';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { StudioDto } from '../dtos';
import { UpdateCommissionPayload } from '../payloads';
import { Studio } from '../schemas';

@Injectable()
export class StudioCommissionService {
  constructor(
    @InjectModel(Studio.name) private readonly StudioModel: Model<Studio>,
    @Inject(forwardRef(() => PerformerCommissionService))
    private readonly performerCommissionService: PerformerCommissionService,
    @Inject(forwardRef(() => PerformerSearchService))
    private readonly performerSearchService: PerformerSearchService
  ) { }

  async searchMemberCommissions(query: PerformerSearchPayload, user) {
    const { data, total } = await this.performerSearchService.search(
      query,
      user
    );

    const performerIds = data.map((p) => p._id);
    const performerCommissions = performerIds.length
      ? await this.performerCommissionService.findByPerformerIds(performerIds)
      : [];

    const defaultStudioCommission = SettingService.getValueByKey(SETTING_KEYS.STUDIO_COMMISSION);
    const defaultPerformerCommssion = SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION);
    const performers = data.map((performer) => {
      const commission = performerCommissions.find(
        (c) => c.performerId.toString() === performer._id.toString()
      );
      if (commission) {
        return {
          ...performer,
          commissionSetting: new PerformerCommissionDto(commission)
        };
      }

      return {
        ...performer,
        commissionSetting: {
          performerId: performer._id,
          tipCommission: defaultPerformerCommssion,
          albumCommission: defaultPerformerCommssion,
          groupCallCommission: defaultPerformerCommssion,
          privateCallCommission: defaultPerformerCommssion,
          productCommission: defaultPerformerCommssion,
          videoCommission: defaultPerformerCommssion,
          studioCommission: defaultStudioCommission,
          spinWheelCommission: defaultPerformerCommssion,
          memberCommission: parseInt(process.env.COMMISSION_RATE, 10)
        }
      };
    });

    return {
      total,
      data: performers.map((d) => new PerformerDto(d).toResponse(true))
    };
  }

  async studioUpdateMemberCommission(
    id: string,
    payload: UpdateCommissionPayload,
    studio: StudioDto
  ) {
    return this.performerCommissionService.studioUpdate(
      id,
      payload,
      studio._id
    );
  }

  async adminUpdateStudioCommission(studioId: string | ObjectId, payload: UpdateCommissionPayload): Promise<StudioDto> {
    const studio = await this.StudioModel.findOne({ _id: studioId });
    if (!studio) {
      throw new EntityNotFoundException();
    }

    merge(studio, payload);
    await studio.save();

    return plainToInstance(StudioDto, studio.toObject());
  }
}
