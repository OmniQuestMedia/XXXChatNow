import {
  IsString,
  IsOptional,
  Validate,
  IsEmail,
  IsNotEmpty,
  IsIn,
  IsArray,
  MinLength,
  IsObject,
  IsMongoId,
  IsBoolean,
  IsTimeZone
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';
import { ObjectId } from 'mongodb';
import { PERFORMER_STATUSES } from '../constants';
import { ICommissionSetting, ISchedule } from '../dtos';

export class PerformerCreatePayload {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn([
    PERFORMER_STATUSES.ACTIVE,
    PERFORMER_STATUSES.INACTIVE,
    PERFORMER_STATUSES.PENDING
  ])
  @IsOptional()
  status = PERFORMER_STATUSES.ACTIVE;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  phoneCode: string; // international code prefix

  @IsString()
  @IsOptional()
  avatarId: string;

  @IsString()
  @IsOptional()
  idVerificationId: string;

  @IsString()
  @IsOptional()
  documentVerificationId: string;

  @IsString()
  @IsOptional()
  releaseFormId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(GENDERS)
  gender: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  zipcode: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages: string[];

  @IsString()
  @IsOptional()
  @IsMongoId()
  studioId: string | ObjectId;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @IsOptional()
  @IsObject()
  schedule: ISchedule;

  @IsString()
  @IsOptional()
  @IsTimeZone()
  timezone: string;

  @IsString()
  @IsOptional()
  noteForUser: string;

  @IsOptional()
  @IsBoolean()
  emailVerified: boolean;

  @IsOptional()
  verified: boolean;

  @IsObject()
  @IsOptional()
  socials: any;

  @IsOptional()
  @IsObject()
  commissionSetting: ICommissionSetting;

  @IsString()
  @IsOptional()
  metaTitle: string;

  @IsString()
  @IsOptional()
  metaDescription: string;

  @IsString()
  @IsOptional()
  metaKeyword: string;
}

export class PerformerRegisterPayload {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn([
    PERFORMER_STATUSES.ACTIVE,
    PERFORMER_STATUSES.INACTIVE,
    PERFORMER_STATUSES.PENDING
  ])
  @IsOptional()
  status = PERFORMER_STATUSES.ACTIVE;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  phoneCode: string; // international code prefix

  @IsString()
  @IsOptional()
  avatarId: string;

  @IsString()
  @IsOptional()
  idVerificationId: string;

  @IsString()
  @IsOptional()
  documentVerificationId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(GENDERS)
  gender: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsString()
  @IsOptional()
  zipcode: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages: string[];

  @IsString()
  @IsOptional()
  @IsTimeZone()
  timezone: string;

  @IsString()
  @IsOptional()
  noteForUser: string;

  @IsOptional()
  @IsBoolean()
  emailVerified: boolean;

  @IsOptional()
  @IsBoolean()
  verified: boolean;

  @IsString()
  @IsOptional()
  rel?: string;
}
