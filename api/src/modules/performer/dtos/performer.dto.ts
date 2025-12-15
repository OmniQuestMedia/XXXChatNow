import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { FileDto } from 'src/modules/file';
import { ObjectId as MongooseObjectId } from 'mongoose';
import { Expose, Transform } from 'class-transformer';
import { ICommissionSetting, PerformerCommissionDto } from './performer-commission.dto';

interface ValueSchedule {
  start: string;
  end: string;
  closed: boolean;
}

export interface ISchedule {
  mon: ValueSchedule;
  tue: ValueSchedule;
  wed: ValueSchedule;
  thu: ValueSchedule;
  fri: ValueSchedule;
  sat: ValueSchedule;
  sun: ValueSchedule;
}

export interface BankTransferInterface {
  type: string;
  withdrawCurrency: string;
  taxPayer: string;
  bankName: string;
  bankAddress: string;
  bankCity: string;
  bankState: string;
  bankZip: string;
  bankCountry: string;
  bankAcountNumber: string;
  bankSWIFTBICABA: string;
  holderOfBankAccount: string;
  additionalInformation: string;
  payPalAccount: string;
  checkPayable: string;
}

export interface DirectDepositInterface {
  depositFirstName: string;
  depositLastName: string;
  accountingEmail: string;
  directBankName: string;
  accountType: string;
  accountNumber: string;
  routingNumber: string;
}

export interface IPaxum {
  paxumName: string;
  paxumEmail: string;
  paxumAdditionalInformation: string;
}

export interface IBitpay {
  bitpayName: string;
  bitpayEmail: string;
  bitpayAdditionalInformation: string;
}

export interface IPerformerResponse {
  _id?: ObjectId;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCode?: string; // international code prefix
  status?: string;
  avatar?: string;
  idVerificationId?: ObjectId;
  streamingStatus?: string;
  streamingTitle?: string;
  documentVerificationId?: ObjectId;
  gender?: string;
  country?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  address?: string;
  languages?: string[];
  tags?: string[];
  studioId?: ObjectId;
  categoryIds?: ObjectId[];
  categories?: string[];
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  height?: string;
  weight?: string;
  bio?: string;
  eyes?: string;
  maxParticipantsAllowed?: number;
  sexualReference?: string;
  aboutMe?: string;
  bust?: string;
  hair?: string;
  ethnicity?: string;
  pubicHair?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  dateOfBirth?: Date;
  timezone?: string;
  bankTransferOption?: BankTransferInterface;
  directDeposit?: DirectDepositInterface;
  verified?: boolean;
  paxum?: IPaxum;
  bitpay?: IBitpay;
  stats?: {
    favorites?: number;
    totalVideos?: number;
    totalPhotos?: number;
    totalGalleries?: number;
    totalProducts?: number;
    totalStreamTime?: number;
    totalTokenEarned?: number;
    totalTokenSpent?: number;
  };
  isOnline?: boolean;
  watching?: number;
  spinWheelPrice?: number;
  wheelOptions?: any;
  isFavorite?: boolean;
  onlineAt?: Date;
  offlineAt?: Date;
  socials?: any;
  commissionSetting?: ICommissionSetting;
  privateCallPrice?: number;
  groupCallPrice?: number;
  lastStreamingTime?: Date;
  metaTitle: string;
  metaDescription: string;
  metaKeyword: string;
  username: string;
  isBlocked: boolean;
  isStreaming: boolean;
  twoFactorAuthenticationEnabled?: boolean;
  peekInTimeLimit: number;
  watermark: any;
  peekInPrice: number;
  enablePeekIn: boolean;
  isPrivacy: boolean;
  badgingTierToken?: number;
}

export class PerformerDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId | MongooseObjectId | string;

  @Expose()
  isPerformer = true;

  @Expose()
  spinWheelPrice?: number;

  @Expose()
  name: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  isDark: boolean;

  @Expose()
  streamingStatus: string;

  @Expose()
  streamingTitle: string;

  @Expose()
  phoneCode: string; // international code prefix

  @Expose()
  status: string;

  @Expose()
  @Transform(({ obj }) => obj.avatarId)
  avatarId: ObjectId;

  @Expose()
  avatarPath: string;

  @Expose()
  @Transform(({ obj }) => obj.idVerificationId)
  idVerificationId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.documentVerificationId)
  documentVerificationId: ObjectId;

  @Expose()
  idVerification: any;

  @Expose()
  documentVerification: any;

  @Expose()
  @Transform(({ obj }) => obj.releaseFormId)
  releaseFormId: ObjectId;

  @Expose()
  releaseForm: any;

  @Expose()
  avatar: any;

  @Expose()
  gender: string;

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
  isPrivacy: boolean;

  @Expose()
  @Transform(({ obj }) => obj.languages)
  languages: string[];

  @Expose()
  @Transform(({ obj }) => obj.tags)
  tags: string[];

  @Expose()
  @Transform(({ obj }) => obj.studioId)
  studioId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.categoryIds)
  categoryIds: ObjectId[];

  @Expose()
  categories: string[];

  @Expose()
  schedule: ISchedule;

  @Expose()
  timezone: string;

  @Expose()
  verified: boolean;

  @Expose()
  noteForUser: string;

  @Expose()
  createdBy: ObjectId;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  height: string;

  @Expose()
  weight: string;

  @Expose()
  bio: string;

  @Expose()
  eyes: string;

  @Expose()
  sexualReference: string;

  @Expose()
  pubicHair: string;

  @Expose()
  hair: string;

  @Expose()
  bust: string;

  @Expose()
  aboutMe: string;

  @Expose()
  ethnicity: string;

  @Expose()
  bankTransferOption: BankTransferInterface;

  @Expose()
  directDeposit: DirectDepositInterface;

  @Expose()
  paxum: IPaxum;

  @Expose()
  bitpay: IBitpay;

  @Expose()
  monthlyPrice: number;

  @Expose()
  yearlyPrice: number;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  @Transform(({ obj }) => obj.stats)
  stats: {
    favorites: number;
    totalVideos: number;
    totalPhotos: number;
    totalGalleries: number;
    totalProducts: number;
    totalStreamTime: number;
    totalTokenEarned: number;
    totalTokenSpent: number;
  };

  @Expose()
  balance: number;

  @Expose()
  emailVerified: boolean;

  @Expose()
  isOnline: boolean;

  @Expose()
  watching: number;

  @Expose()
  onlineAt: Date;

  @Expose()
  offlineAt: Date;

  @Expose()
  isStreaming: boolean;

  @Expose()
  isFavorite: boolean;

  @Expose()
  isBlocked: boolean;

  @Expose()
  socials: any;

  @Expose()
  commissionSetting: Partial<PerformerCommissionDto>;

  @Expose()
  maxParticipantsAllowed: number;

  @Expose()
  privateCallPrice: number;

  @Expose()
  groupCallPrice: number;

  @Expose()
  lastStreamingTime: Date;

  @Expose()
  studioInfo: any;

  @Expose()
  metaTitle: string;

  @Expose()
  metaDescription: string;

  @Expose()
  metaKeyword: string;

  @Expose()
  twoFactorAuthenticationEnabled?: boolean;

  @Expose()
  watermark: any;

  @Expose()
  wheelOptions: any;

  @Expose()
  peekInTimeLimit: number;

  @Expose()
  peekInPrice: number;

  @Expose()
  enablePeekIn: boolean;

  @Expose()
  badgingTierToken?: number;

  constructor(data?: Partial<PerformerDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'firstName',
        'lastName',
        'name',
        'username',
        'email',
        'phone',
        'phoneCode',
        'status',
        'avatarId',
        'avatarPath',
        'bankTransferOption',
        'directDeposit',
        'maxParticipantsAllowed',
        'paxum',
        'bitpay',
        'streamingStatus',
        'streamingTitle',
        'idVerificationId',
        'idVerification',
        'documentVerificationId',
        'documentVerification',
        'releaseFormId',
        'releaseForm',
        'gender',
        'country',
        'city',
        'state',
        'zipcode',
        'address',
        'languages',
        'tags',
        'studioId',
        'categoryIds',
        'categories',
        'schedule',
        'timezone',
        'noteForUser',
        'createdBy',
        'createdAt',
        'updatedAt',
        'eyes',
        'height',
        'weight',
        'bio',
        'sexualReference',
        'hair',
        'pubicHair',
        'ethnicity',
        'aboutMe',
        'bust',
        'dateOfBirth',
        'balance',
        'isPerformer',
        'emailVerified',
        'isOnline',
        'watching',
        'onlineAt',
        'offlineAt',
        'isStreaming',
        'isFavorite',
        'isBlocked',
        'socials',
        'verified',
        'stats',
        'commissionSetting',
        'privateCallPrice',
        'groupCallPrice',
        'lastStreamingTime',
        'studioInfo',
        'metaTitle',
        'metaDescription',
        'metaKeyword',
        'twoFactorAuthenticationEnabled',
        'watermark',
        'spinWheelPrice',
        'wheelOptions',
        'isPrivacy',
        'peekInTimeLimit',
        'peekInPrice',
        'enablePeekIn',
        'isPrivacy',
        'spinWheelPrice',
        'wheelOptions',
        'badgingTierToken',
        'isDark'
      ])
    );
  }

  toResponse(includePrivateInfo = false): Partial<PerformerDto> {
    const publicInfo = {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      // dateOfBirth: this.dateOfBirth,
      // phone: this.phone,
      isOnline: this.isOnline,
      watching: this.watching,
      gender: this.gender,
      isStreaming: this.isStreaming,
      isFavorite: this.isFavorite,
      socials: this.socials,
      stats: this.stats,
      lastStreamingTime: this.lastStreamingTime,
      streamingStatus: this.streamingStatus,
      streamingTitle: this.streamingTitle,
      country: this.country,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      // address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      categories: this.categories,
      tags: this.tags,
      aboutMe: this.aboutMe,
      isBlocked: this.isBlocked,
      privateCallPrice: this.privateCallPrice,
      groupCallPrice: this.groupCallPrice,
      offlineAt: this.offlineAt,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      metaKeyword: this.metaKeyword,
      twoFactorAuthenticationEnabled: this.twoFactorAuthenticationEnabled,
      watermark: this.watermark,
      spinWheelPrice: this.spinWheelPrice,
      wheelOptions: this.wheelOptions,
      isPrivacy: this.isPrivacy,
      peekInTimeLimit: this.peekInTimeLimit,
      peekInPrice: this.peekInPrice,
      enablePeekIn: this.enablePeekIn,
      badgingTierToken: this.badgingTierToken,
      isDark: this.isDark
    };

    const privateInfo = {
      email: this.email,
      phone: this.phone,
      phoneCode: this.phoneCode,
      dateOfBirth: this.dateOfBirth,
      status: this.status,
      name: this.getName(),
      firstName: this.firstName,
      lastName: this.lastName,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address: this.address,
      languages: this.languages,
      idVerificationId: this.idVerificationId,
      documentVerificationId: this.documentVerificationId,
      documentVerification: this.documentVerification,
      releaseFormId: this.releaseFormId,
      releaseForm: this.releaseForm,
      idVerification: this.idVerification,
      schedule: this.schedule,
      timezone: this.timezone,
      noteForUser: this.noteForUser,
      bankTransferOption: this.bankTransferOption,
      directDeposit: this.directDeposit,
      paxum: this.paxum,
      bitpay: this.bitpay,
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      sexualReference: this.sexualReference,
      hair: this.hair,
      aboutMe: this.aboutMe,
      pubicHair: this.pubicHair,
      bust: this.bust,
      ethnicity: this.ethnicity,
      tags: this.tags,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      stats: this.stats,
      balance: this.balance,
      isPerformer: this.isPerformer,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      emailVerified: this.emailVerified,
      verified: this.verified,
      onlineAt: this.onlineAt,
      offlineAt: this.offlineAt,
      privateCallPrice: this.privateCallPrice,
      groupCallPrice: this.groupCallPrice,
      maxParticipantsAllowed: this.maxParticipantsAllowed,
      commissionSetting: this.commissionSetting,
      studioId: this.studioId,
      studioInfo: this.studioInfo,
      isPrivacy: this.isPrivacy,
      badgingTierToken: this.badgingTierToken
    };
    if (!includePrivateInfo) {
      return publicInfo;
    }

    return {
      ...publicInfo,
      ...privateInfo
    };
  }

  getName() {
    if (this.name) return this.name;
    return [this.firstName || '', this.lastName || ''].join(' ').trim();
  }

  toSearchResponse(): Partial<PerformerDto> {
    return {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      gender: this.gender,
      languages: this.languages,
      tags: this.tags,
      streamingStatus: this.streamingStatus,
      streamingTitle: this.streamingTitle,
      aboutMe: this.aboutMe,
      isFavorite: this.isFavorite,
      isBlocked: this.isBlocked,
      isStreaming: this.isStreaming,
      isOnline: this.isOnline,
      watching: this.watching,
      lastStreamingTime: this.lastStreamingTime,
      privateCallPrice: this.privateCallPrice,
      groupCallPrice: this.groupCallPrice,
      categoryIds: this.categoryIds,
      categories: this.categories,
      stats: this.stats,
      dateOfBirth: this.dateOfBirth,
      offlineAt: this.offlineAt,
      peekInTimeLimit: this.peekInTimeLimit,
      peekInPrice: this.peekInPrice,
      enablePeekIn: this.enablePeekIn,
      badgingTierToken: this.badgingTierToken
    };
  }

  toPublicDetailsResponse() {
    return {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      status: this.status,
      gender: this.gender,
      country: this.country,
      streamingStatus: this.streamingStatus,
      streamingTitle: this.streamingTitle,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      // address: this.address,
      languages: this.languages,
      categoryIds: this.categoryIds,
      categories: this.categories,
      schedule: this.schedule,
      timezone: this.timezone,
      noteForUser: this.noteForUser,
      height: this.height,
      weight: this.weight,
      bio: this.bio,
      eyes: this.eyes,
      tags: this.tags,
      hair: this.hair,
      aboutMe: this.aboutMe,
      pubicHair: this.pubicHair,
      bust: this.bust,
      ethnicity: this.ethnicity,
      sexualReference: this.sexualReference,
      monthlyPrice: this.monthlyPrice,
      yearlyPrice: this.yearlyPrice,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      dateOfBirth: this.dateOfBirth,
      isOnline: this.isOnline,
      watching: this.watching,
      isStreaming: this.isStreaming,
      isFavorite: this.isFavorite,
      isBlocked: this.isBlocked,
      verified: this.verified,
      socials: this.socials,
      privateCallPrice: this.privateCallPrice,
      groupCallPrice: this.groupCallPrice,
      maxParticipantsAllowed: this.maxParticipantsAllowed,
      onlineAt: this.onlineAt,
      offlineAt: this.offlineAt,
      lastStreamingTime: this.lastStreamingTime,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      metaKeyword: this.metaKeyword,
      spinWheelPrice: this.spinWheelPrice,
      wheelOptions: this.wheelOptions,
      peekInTimeLimit: this.peekInTimeLimit,
      peekInPrice: this.peekInPrice,
      enablePeekIn: this.enablePeekIn,
      badgingTierToken: this.badgingTierToken,
      isDark: this.isDark
    };
  }

  toPrivateRequestResponse() {
    return {
      _id: this._id,
      avatar: FileDto.getPublicUrl(this.avatarPath),
      username: this.username,
      isOnline: this.isOnline,
      isPerformer: true
    };
  }
}
