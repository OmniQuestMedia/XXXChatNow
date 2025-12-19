import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { StudioDto } from 'src/modules/studio/dtos';

export class ReferralEarningDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  registerSource: string;

  @Expose()
  @Transform(({ obj }) => obj.registerId)
  registerId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.registerInfo)
  registerInfo?: Partial<UserDto | PerformerDto | StudioDto>;

  @Expose()
  referralSource: string;

  @Expose()
  @Transform(({ obj }) => obj.referralId)
  referralId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.referralInfo)
  referralInfo?: Partial<UserDto | PerformerDto | StudioDto>;

  @Expose()
  earningId: ObjectId;

  @Expose()
  type: string;

  @Expose()
  grossPrice: number;

  @Expose()
  netPrice: number;

  @Expose()
  referralCommission: number;

  @Expose()
  isPaid: boolean;

  @Expose()
  paidAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  isToken: boolean;

  @Expose()
  transactionStatus: string;

  constructor(data: Partial<ReferralEarningDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'registerSource',
        'registerId',
        'registerInfo',
        'referralSource',
        'referralId',
        'referralInfo',
        'earningId',
        'type',
        'grossPrice',
        'netPrice',
        'referralCommission',
        'isPaid',
        'paidAt',
        'createdAt',
        'isToken',
        'transactionStatus'
      ])
    );
  }

  public setRegisterInfo(registerInfo: UserDto | PerformerDto | StudioDto) {
    if (!registerInfo) return;
    this.registerInfo = registerInfo.toResponse();
  }

  public setReferralInfo(referralInfo: UserDto | PerformerDto | StudioDto) {
    if (!referralInfo) return;
    this.referralInfo = referralInfo.toResponse();
  }
}

export interface IReferralEarningStatResponse {
  totalRegisters: number;
  totalSales: number;
  totalNetPrice: number;
  totalTokenNetPrice: number;
}
