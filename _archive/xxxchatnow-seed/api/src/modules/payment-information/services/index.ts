import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EntityNotFoundException, PageableData } from 'src/kernel';
import { StudioService } from 'src/modules/studio/services';
import { PerformerService } from 'src/modules/performer/services';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import {
  PaymentInformationPayload,
  AdminCreatePaymentInformationPayload,
  AdminSearchPaymentInformationPayload
} from '../payloads';
import { BANKING_SOURCE } from '../constants';
import { PaymentInformation } from '../schemas';
import { PaymentInformationDto } from '../dtos';

@Injectable()
export class PaymentInformationService {
  constructor(
    @InjectModel(PaymentInformation.name) private readonly PaymentInformationModel: Model<PaymentInformation>,
    private readonly studioService: StudioService,
    private readonly performerService: PerformerService
  ) { }

  public async findById(id: string | ObjectId): Promise<PaymentInformationDto> {
    const model = await this.PaymentInformationModel.findOne({ _id: id });
    const dto = plainToInstance(PaymentInformationDto, model.toObject(), {
      excludeExtraneousValues: false
    });
    return dto;
  }

  async create(payload: PaymentInformationPayload, user): Promise<PaymentInformationDto> {
    const { type } = payload;
    let payment = await this.PaymentInformationModel.findOne({
      sourceId: user._id,
      type
    });
    if (!payment) {
      payment = await this.PaymentInformationModel.create({
        sourceId: user._id,
        sourceType: user?.roles?.includes('studio')
          ? BANKING_SOURCE.STUDIO
          : BANKING_SOURCE.PERFORMER,
        type
      });
    }

    Object.keys(payload).forEach((field) => {
      payment.set(field, payload[field]);
    });
    await payment.save();
    return PaymentInformationDto.fromModel(payment);
  }

  async detail(
    payload: PaymentInformationPayload,
    sourceId: string | ObjectId
  ): Promise<PaymentInformationDto> {
    const { type } = payload;
    const payment = await this.PaymentInformationModel.findOne({ sourceId, type });

    return PaymentInformationDto.fromModel(payment);
  }

  async adminDetail(id: string | ObjectId) {
    const paymentInfo = await this.PaymentInformationModel.findById(id);
    if (!paymentInfo) {
      throw new EntityNotFoundException();
    }

    const { sourceType, sourceId } = paymentInfo;
    const sourceInfo = sourceType === BANKING_SOURCE.STUDIO
      ? await this.studioService.findById(sourceId)
      : await this.performerService.findById(sourceId);

    const dto = PaymentInformationDto.fromModel(paymentInfo);
    dto.setSourceInfo(sourceInfo);
    return dto;
  }

  async adminCreate(payload: AdminCreatePaymentInformationPayload) {
    const { type, sourceId, sourceType } = payload;
    let payment = await this.PaymentInformationModel.findOne({
      sourceId,
      type
    });
    if (!payment) {
      payment = await this.PaymentInformationModel.create({
        sourceId,
        sourceType,
        type
      });
    }

    Object.keys(payload).forEach((field) => {
      payment.set(field, payload[field]);
    });
    await payment.save();
    return payment.toObject();
  }

  async adminSearch(
    req: AdminSearchPaymentInformationPayload
  ): Promise<PageableData<any>> {
    const query = {};
    Object.keys(req).forEach((field) => {
      if (['type', 'sourceId', 'sourceType'].includes(field)) {
        query[field] = req[field];
      }
    });
    let sort = {};
    if (req.sort) {
      sort = {
        [req.sortBy || 'updatedAt']: req.sort || -1
      };
    }
    const [data, total] = await Promise.all([
      this.PaymentInformationModel
        .find(query)
        .skip(Number(req.offset))
        .limit(Number(req.limit))
        .sort(sort)
        .exec(),
      this.PaymentInformationModel.countDocuments(query)
    ]);
    const performerIds = data.filter((d) => d.sourceType === 'performer').map((d) => d.sourceId);
    const studioIds = data.filter((d) => d.sourceType === 'studio').map((d) => d.sourceId);
    const [performers, studios] = await Promise.all([
      performerIds.length ? await this.performerService.findByIds(performerIds) : [],
      studioIds.length ? await this.studioService.findByIds(studioIds) : []
    ]);
    const sources = [...performers, ...studios];
    const dtos = data.map((d) => {
      const dto = plainToInstance(PaymentInformationDto, d.toObject());
      const source = sources.find((s) => `${s._id}` === `${d.sourceId}`);
      dto.setSourceInfo(source);
      return dto;
    });

    return {
      data: dtos,
      total
    };
  }
}
