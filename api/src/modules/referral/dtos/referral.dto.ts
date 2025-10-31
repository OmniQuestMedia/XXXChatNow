import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { UserDto } from 'src/modules/user/dtos';
import { PerformerDto } from 'src/modules/performer/dtos';
import { StudioDto } from 'src/modules/studio/dtos';

export class ReferralDto {
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
  createdAt: Date;

  constructor(data: Partial<ReferralDto>) {
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
        'createdAt'
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
