import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';
import { ObjectId as MongooseObjectId } from 'mongoose';
import { Expose, Transform } from 'class-transformer';

export interface IUserStats {
  totalViewTime: number;
  totalTokenEarned: number;
  totalTokenSpent: number;
  // enableGhostMode?: boolean;
  // displayName?: string;
}

export interface IUserResponse {
  _id?: ObjectId;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  timezone?: string;
  avatar?: string;
  status?: string;
  gender?: string;
  balance?: number;
  country?: string;
  city?: string;
  dateOfBirth?: Date;
  state?: string;
  emailVerified?: boolean;
  stats?: {
    totalViewTime?: number;
    totalTokenEarned?: number;
    totalTokenSpent?: number;
  };
  isOnline?: boolean;
  onlineAt?: Date;
  offlineAt?: Date;
  totalOnlineTime?: number;
  createdAt?: Date;
  username?: string;
  enableGhostMode?: boolean;
  displayName?: string;
  twoFactorAuthenticationEnabled?: boolean;
  isPerformer?: boolean;
  isPrivacy?: boolean;
  agePreferences?: string[];
  genderPreferences?: string[];
  ethnicPreferences?: string[];
  tagPreferences?: string[];
  badgingColor?: string;
}

export class UserDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId | MongooseObjectId | string;

  @Expose()
  name: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  timezone: string;

  @Transform(({ obj }) => obj.roles)
  roles: string[] = ['user'];

  @Transform(({ obj }) => obj.avatarId)
  avatarId: string | ObjectId;

  @Expose()
  avatarPath: string;

  @Expose()
  status: string;

  @Expose()
  username: string;

  @Expose()
  isDark: boolean;

  @Expose()
  gender: string;

  @Expose()
  balance: number;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  city: string;

  @Expose()
  stats: IUserStats;

  @Expose()
  state: string;

  @Expose()
  country: string;

  @Expose()
  emailVerified: boolean;

  @Expose()
  isOnline: boolean;

  @Expose()
  onlineAt: Date;

  @Expose()
  offlineAt: Date;

  @Expose()
  totalOnlineTime: number;

  @Expose()
  isPerformer: boolean;

  @Expose()
  twoFactorAuthenticationEnabled: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  twoFactorAuthenticationSecret?: string;

  @Expose()
  isTwoFactorAuthenticationEnabled?: boolean;

  @Expose()
  enableGhostMode?: boolean;

  @Expose()
  displayName?: string;

  @Expose()
  isPrivacy?: boolean;

  @Expose()
  badgingColor?: string;

  @Expose()
  memberRank?: any;

  @Expose()
  agePreferences?: string[];

  @Expose()
  genderPreferences?: string[];

  @Expose()
  ethnicPreferences?: string[];

  @Expose()
  tagPreferences?: string[];

  constructor(data: Partial<UserDto>) {
    data
      && Object.assign(
        this,
        pick(data, [
          '_id',
          'name',
          'firstName',
          'lastName',
          'email',
          'phone',
          'roles',
          'avatarId',
          'timezone',
          'avatarPath',
          'status',
          'username',
          'gender',
          'balance',
          'stats',
          'country',
          'city',
          'dateOfBirth',
          'state',
          'emailVerified',
          'isOnline',
          'onlineAt',
          'offlineAt',
          'totalOnlineTime',
          'isPerformer',
          'twoFactorAuthenticationEnabled',
          'createdAt',
          'isTwoFactorAuthenticationEnabled',
          'twoFactorAuthenticationSecret',
          'enableGhostMode',
          'displayName',
          'twoFactorAuthenticationEnabled',
          'isPerformer',
          'agePreferences',
          'genderPreferences',
          'ethnicPreferences',
          'tagPreferences',
          'isPrivacy',
          'memberRank',
          'badgingColor',
          'isDark'
        ])
      );
  }

  toResponse(includePrivateInfo = false): Partial<UserDto> {
    const publicInfo = {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      roles: this.roles,
      isOnline: this.isOnline,
      enableGhostMode: this.enableGhostMode,
      displayName: this.enableGhostMode ? 'Anonymous' : this.username,
      isPerformer: this.isPerformer,
      username: this.username,
      isDark: this.isDark,
      agePreferences: this.agePreferences,
      genderPreferences: this.genderPreferences,
      ethnicPreferences: this.ethnicPreferences,
      tagPreferences: this.tagPreferences,
      memberRank: this.memberRank,
      badgingColor: this.badgingColor
    };

    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      name: this.name || `${this.firstName} ${this.lastName}`,
      email: this.email,
      phone: this.phone,
      status: this.status,
      gender: this.gender,
      firstName: this.firstName,
      lastName: this.lastName,
      balance: this.balance,
      country: this.country,
      city: this.city,
      stats: this.stats,
      dateOfBirth: this.dateOfBirth,
      state: this.state,
      timezone: this.timezone,
      emailVerified: this.emailVerified,
      onlineAt: this.onlineAt,
      offlineAt: this.offlineAt,
      totalOnlineTime: this.totalOnlineTime,
      isPerformer: this.isPerformer,
      twoFactorAuthenticationEnabled: this.twoFactorAuthenticationEnabled,
      createdAt: this.createdAt,
      username: this.username
    };
  }

  toEmailResponse(): IUserResponse {
    const publicInfo = {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      roles: this.roles,
      isOnline: this.isOnline,
      enableGhostMode: this.enableGhostMode
    };

    return {
      ...publicInfo,
      name: this.name || `${this.firstName} ${this.lastName}`,
      email: this.email,
      phone: this.phone,
      status: this.status,
      gender: this.gender,
      firstName: this.firstName,
      lastName: this.lastName,
      balance: this.balance,
      country: this.country,
      city: this.city,
      stats: this.stats,
      dateOfBirth: this.dateOfBirth,
      state: this.state,
      timezone: this.timezone,
      emailVerified: this.emailVerified,
      onlineAt: this.onlineAt,
      offlineAt: this.offlineAt,
      totalOnlineTime: this.totalOnlineTime,
      createdAt: this.createdAt,
      username: this.enableGhostMode ? 'Anonymous' : this.username,
      twoFactorAuthenticationEnabled: this.twoFactorAuthenticationEnabled,
      isPerformer: this.isPerformer,
      isPrivacy: this.isPrivacy
    };
  }

  toPrivateRequestResponse() {
    return {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      roles: this.roles,
      username: this.username,
      balance: this.balance,
      isOnline: this.isOnline,
      isTwoFactorAuthenticationEnabled: this.isTwoFactorAuthenticationEnabled,
      twoFactorAuthenticationSecret: this.twoFactorAuthenticationSecret,
      displayName: this.enableGhostMode ? 'Anonymous' : this.username,
      isPerformer: this.isPerformer
    };
  }

  public toSearchResponse() {
    return {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      roles: this.roles,
      username: this.username,
      isOnline: this.isOnline,
      displayName: this.enableGhostMode ? 'Anonymous' : this.username,
      isPerformer: this.isPerformer
    };
  }
}
