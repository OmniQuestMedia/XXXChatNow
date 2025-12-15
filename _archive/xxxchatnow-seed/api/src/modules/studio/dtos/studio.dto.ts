import { Expose, Transform } from 'class-transformer';
import { IsTimeZone } from 'class-validator';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export interface IStudioStats {
  totalPerformer: number;
  totalHoursOnline: number;
  totalTokenEarned: number;
  totalOnlineToday: number;
  totalTokenSpent: number;
  _id: ObjectId;
  name: string;
  username: string;
  email: string;
  status: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  zipcode: string;
  address: string;
  languages: string[];
  roles: string[];
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  balance: number;
  emailVerified?: boolean;
  stats?: {
    totalPerformer?: number;
    totalHoursOnline?: number;
    totalTokenEarned?: number;
    totalOnlineToday?: number;
    totalTokenSpent?: number;
  };
  documentVerificationId: ObjectId;
  documentVerificationFile: string;
  documentVerification: any;
  commission: number;
  tipCommission: number;
  privateCallCommission: number;
  groupCallCommission: number,
  productCommission: number,
  albumCommission: number,
  videoCommission: number,
  spinWheelCommission: number
}
export class StudioDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId | MongooseObjectId | string;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  status: string;

  @Expose()
  phone: string;

  @Expose()
  country: string;

  @Expose()
  city: string;

  @Expose()
  state: string;

  @Expose()
  zipcode: string;

  @Expose()
  address: string;

  @Expose()
  @Transform(({ obj }) => obj.languages)
  languages: string[];

  @Expose()
  @Transform(({ obj }) => obj.roles)
  roles: string[];

  @Expose()
  @IsTimeZone()
  timezone: string;

  @Expose()
  balance: number;

  @Expose()
  emailVerified: boolean;

  @Expose()
  @Transform(({ obj }) => obj.stats)
  stats: IStudioStats;

  @Expose()
  @Transform(({ obj }) => obj.documentVerificationId)
  documentVerificationId: ObjectId | MongooseObjectId | string;

  @Expose()
  documentVerificationFile: string;

  @Expose()
  documentVerification: Record<string, any>;

  @Expose()
  commission: number;

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
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  spinWheelCommission: number;

  constructor(payload: any) {
    Object.assign(
      this,
      pick(payload, [
        '_id',
        'name',
        'username',
        'email',
        'status',
        'phone',
        'country',
        'city',
        'state',
        'zipcode',
        'address',
        'roles',
        'languages',
        'timezone',
        'balance',
        'emailVerified',
        'stats',
        'documentVerificationId',
        'documentVerificationFile',
        'commission',
        'tipCommission',
        'privateCallCommission',
        'groupCallCommission',
        'productCommission',
        'albumCommission',
        'videoCommission',
        'createdAt',
        'updatedAt',
        'spinWheelCommission'
      ])
    );
  }

  toResponse(includePrivateInfo = false): Partial<StudioDto> {
    const publicInfo = {
      _id: this._id,
      name: this.name,
      username: this.username,
      email: this.email,
      status: this.status,
      phone: this.phone,
      country: this.country,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      timezone: this.timezone,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      stats: this.stats
    };

    if (!includePrivateInfo) {
      return publicInfo;
    }

    const privateInfo = {
      emailVerified: this.emailVerified,
      commission: this.commission,
      documentVerificationId: this.documentVerificationId,
      documentVerificationFile: this.documentVerificationFile,
      balance: this.balance,
      roles: this.roles,
      tipCommission: this.tipCommission,
      privateCallCommission: this.privateCallCommission,
      groupCallCommission: this.groupCallCommission,
      productCommission: this.productCommission,
      albumCommission: this.albumCommission,
      videoCommission: this.videoCommission,
      spinWheelCommission: this.spinWheelCommission
    };
    return {
      ...publicInfo,
      ...privateInfo
    };
  }
}
