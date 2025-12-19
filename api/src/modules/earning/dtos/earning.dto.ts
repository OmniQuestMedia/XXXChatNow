import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { StudioDto } from 'src/modules/studio/dtos';
import { PurchasedItemDto } from 'src/modules/purchased-item/dtos';

export interface IEarningStatResponse {
  totalPrice: number;
  paidPrice: number;
  remainingPrice: number;
  sharedPrice: number;
}

export class EarningDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.userId)
  userId: ObjectId;

  @Transform(({ obj }) => obj.userInfo)
  userInfo: Partial<UserDto>;

  @Expose()
  @Transform(({ obj }) => obj.transactionTokenId)
  transactionTokenId: ObjectId;

  @Expose()
  transactionInfo: any;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerInfo)
  performerInfo: Partial<PerformerDto>;

  @Expose()
  source: string;

  @Expose()
  target: string;

  @Expose()
  type: string;

  @Expose()
  originalPrice: number;

  @Expose()
  grossPrice: number;

  @Expose()
  netPrice: number;

  @Expose()
  commission: number;

  @Expose()
  isPaid: boolean;

  @Expose()
  paidAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.targetId)
  targetId: ObjectId;

  @Expose()
  transactionStatus: string;

  @Expose()
  sourceInfo: Partial<UserDto | PerformerDto | StudioDto>;

  @Expose()
  targetInfo: Partial<UserDto | PerformerDto | StudioDto>;

  @Expose()
  conversionRate: number;

  @Expose()
  sourceType: string;

  @Expose()
  price: number;

  @Expose()
  payoutStatus: string;

  @Expose()
  @Transform(({ obj }) => obj.studioToModel)
  studioToModel: Record<string, any>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data: Partial<EarningDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'userId',
        'userInfo',
        'transactionTokenId',
        'transactionInfo',
        'performerId',
        'performerInfo',
        'sourceType',
        'originalPrice',
        'grossPrice',
        'netPrice',
        'isPaid',
        'commission',
        'createdAt',
        'updatedAt',
        'paidAt',
        'transactionStatus',
        'sourceId',
        'targetId',
        'source',
        'target',
        'type',
        'sourceInfo',
        'targetInfo',
        'conversionRate',
        'price',
        'payoutStatus',
        'studioToModel'
      ])
    );
  }

  toResponse(includePrivate = false): Partial<EarningDto> {
    const publicInfo = {
      _id: this._id,
      userId: this.userId,
      userInfo: this.userInfo,
      transactionTokenId: this.transactionTokenId,
      transactionInfo: this.transactionInfo,
      performerId: this.performerId,
      performerInfo: this.performerInfo,
      sourceType: this.sourceType,
      originalPrice: this.originalPrice,
      grossPrice: this.grossPrice,
      netPrice: this.netPrice,
      isPaid: this.isPaid,
      commission: this.commission,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      paidAt: this.paidAt,
      transactionStatus: this.transactionStatus,
      sourceId: this.sourceId,
      targetId: this.targetId,
      source: this.source,
      target: this.target,
      type: this.type,
      sourceInfo: this.sourceInfo,
      targetInfo: this.targetInfo,
      price: this.price,
      conversionRate: this.conversionRate,
      payoutStatus: this.payoutStatus,
      studioToModel: this.studioToModel
    };

    if (!includePrivate) {
      return publicInfo;
    }

    return {
      ...publicInfo
    };
  }

  public setSourceInfo(sourceInfo: UserDto | PerformerDto | StudioDto) {
    if (!sourceInfo) return;
    this.sourceInfo = sourceInfo.toResponse();
  }

  public setTargetInfo(targetInfo: UserDto | PerformerDto | StudioDto) {
    if (!targetInfo) return;
    this.targetInfo = targetInfo.toResponse();
  }

  public setTransactioInfo(transaction: PurchasedItemDto) {
    if (!transaction) return;
    this.transactionInfo = transaction;
  }

  public setUserInfo(userInfo: UserDto) {
    if (!userInfo) return;
    this.userInfo = userInfo.toResponse();
  }

  public setPerformerInfo(performerInfo: PerformerDto) {
    if (!performerInfo) return;
    this.performerInfo = performerInfo.toResponse();
  }
}
