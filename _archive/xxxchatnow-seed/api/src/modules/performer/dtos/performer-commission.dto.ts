import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';

export interface ICommissionSetting {
  _id?: ObjectId;
  performerId: ObjectId;
  tipCommission: number;
  privateCallCommission: number;
  groupCallCommission: number;
  productCommission: number;
  albumCommission: number;
  videoCommission: number;
  spinWheelCommission: number;
  studioCommission: number;
  memberCommission: number;
}

export class PerformerCommissionDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  tipCommission: number;

  @Expose()
  privateCallCommission: number;

  @Expose()
  groupCallCommission: number;

  @Expose()
  productCommission: number;

  @Expose()
  albumCommission: number;

  @Expose()
  videoCommission: number;

  @Expose()
  studioCommission: number;

  @Expose()
  spinWheelCommission: number;

  @Expose()
  memberCommission: number;

  @Expose()
  @Transform(({ obj }) => obj.createdBy)
  createdBy: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.updatedBy)
  updatedBy: ObjectId;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data?: Partial<PerformerCommissionDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'performerId',
        'tipCommission',
        'privateCallCommission',
        'groupCallCommission',
        'productCommission',
        'albumCommission',
        'videoCommission',
        'spinWheelCommission',
        'studioCommission',
        'memberCommission',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        'spinWheelCommission'
      ])
    );
  }
}
