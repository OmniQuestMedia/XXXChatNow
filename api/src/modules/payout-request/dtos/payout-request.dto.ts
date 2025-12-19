import { Expose, Transform } from 'class-transformer';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';
import { PerformerDto } from 'src/modules/performer/dtos';
import { StudioDto } from 'src/modules/studio/dtos';
import { UserDto } from 'src/modules/user/dtos';

export class PayoutRequestDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  source: string;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerInfo)
  performerInfo: any;

  @Expose()
  @Transform(({ obj }) => obj.studioId)
  studioId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.studioRequestId)
  studioRequestId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.studioInfo)
  studioInfo: any;

  @Expose()
  @Transform(({ obj }) => obj.paymentAccountInfo)
  paymentAccountInfo: any;

  @Expose()
  paymentAccountType: string;

  @Expose()
  fromDate: Date;

  @Expose()
  toDate: Date;

  @Expose()
  requestNote: string;

  @Expose()
  adminNote: string;

  @Expose()
  status: string;

  @Expose()
  sourceType: string;

  @Expose()
  tokenMustPay: number;

  @Expose()
  previousPaidOut: number;

  @Expose()
  pendingToken: number;

  @Expose()
  @Transform(({ obj }) => obj.sourceInfo)
  sourceInfo: Partial<UserDto | PerformerDto | StudioDto>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  conversionRate: number;

  constructor(data: Partial<PayoutRequestDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'source',
        'sourceId',
        'performerId',
        'performerInfo',
        'sourceInfo',
        'studioId',
        'studioInfo',
        'paymentAccountType',
        'fromDate',
        'toDate',
        'paymentAccountInfo',
        'requestNote',
        'adminNote',
        'status',
        'sourceType',
        'tokenMustPay',
        'previousPaidOut',
        'pendingToken',
        'createdAt',
        'updatedAt',
        'conversionRate'
      ])
    );
  }

  public setSourceInfo(sourceInfo: UserDto | PerformerDto | StudioDto) {
    if (!sourceInfo) return;

    this.sourceInfo = sourceInfo.toResponse();
  }

  public setPerformerInfo(performer: PerformerDto) {
    if (!performer) return;
    this.performerInfo = performer.toResponse();
  }

  public setStudioInfo(studio: StudioDto) {
    if (!studio) return;
    this.studioInfo = studio.toResponse();
  }
}
