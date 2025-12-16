import { Injectable, ForbiddenException } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UpdateCommissionPayload } from 'src/modules/studio/payloads';
import { EntityNotFoundException } from 'src/kernel';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { PerformerCommissionPayload } from '../payloads';
import { PerformerService } from './performer.service';
import { PerformerCommissionDto } from '../dtos';
import { PerformerCommission } from '../schemas';

@Injectable()
export class PerformerCommissionService {
  constructor(
    @InjectModel(PerformerCommission.name) private readonly PerformerCommissionModel: Model<PerformerCommission>,
    private readonly performerService: PerformerService
  ) { }

  public async findOne(params: FilterQuery<PerformerCommission>): Promise<PerformerCommissionDto> {
    const item = await this.PerformerCommissionModel.findOne(params);
    if (!item) return null;

    return plainToInstance(PerformerCommissionDto, item.toObject());
  }

  public async findByPerformerIds(ids: ObjectId[]): Promise<PerformerCommissionDto[]> {
    const items = await this.PerformerCommissionModel.find({ performerId: { $in: ids } });
    return items.map((item) => plainToInstance(PerformerCommissionDto, item.toObject()));
  }

  public async findByPerformerId(performerId: string | ObjectId) {
    const item = await this.PerformerCommissionModel.findOne({ performerId });
    if (!item) return null; // TODO - check if need to show default settings?

    return plainToInstance(PerformerCommissionDto, item.toObject());
  }

  public async create(performerId: string | ObjectId, payload: PerformerCommissionPayload): Promise<PerformerCommissionDto> {
    const data = {
      ...payload,
      performerId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const item = await this.PerformerCommissionModel.create(data);
    return plainToInstance(PerformerCommissionDto, item.toObject());
  }

  public async update(performerId: ObjectId | string, payload: PerformerCommissionPayload | Record<string, any>): Promise<PerformerCommissionDto> {
    let item = await this.PerformerCommissionModel.findOne({ performerId });
    if (!item) {
      item = new this.PerformerCommissionModel();
    }
    item.performerId = performerId;
    item.tipCommission = payload.tipCommission;
    item.privateCallCommission = payload.privateCallCommission;
    item.groupCallCommission = payload.groupCallCommission;
    item.productCommission = payload.productCommission;
    item.albumCommission = payload.albumCommission;
    item.videoCommission = payload.videoCommission;
    await item.save();
    return plainToInstance(PerformerCommissionDto, item.toObject());
  }

  public async updateUpsert(performerId: string | ObjectId, payload: Partial<PerformerCommissionPayload | any>) {
    let item = await this.PerformerCommissionModel.findOne({ performerId });
    if (!item) {
      item = new this.PerformerCommissionModel();
    }
    await this.PerformerCommissionModel.updateOne({ performerId }, { $set: { payload, upsert: true } });
  }

  public async studioUpdate(performerId: string, payload: UpdateCommissionPayload, studioId: ObjectId) {
    const performer = await this.performerService.findById(performerId);
    if (!performer) throw new EntityNotFoundException();

    if (performer.studioId.toString() !== studioId.toString()) throw new ForbiddenException();

    const commission = await this.PerformerCommissionModel.findOne({ performerId });
    if (!commission) {
      const data = {
        ...payload,
        performerId
      };
      const item = await this.PerformerCommissionModel.create(data);
      return plainToInstance(PerformerCommissionDto, item.toObject());
    }

    commission.tipCommission = payload.tipCommission;
    commission.privateCallCommission = payload.privateCallCommission;
    commission.groupCallCommission = payload.groupCallCommission;
    commission.productCommission = payload.productCommission;
    commission.albumCommission = payload.albumCommission;
    commission.videoCommission = payload.videoCommission;
    await commission.save();
    return plainToInstance(PerformerCommissionDto, commission.toObject());
  }
}
