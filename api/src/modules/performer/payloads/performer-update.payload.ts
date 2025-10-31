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
  IsTimeZone,
  IsBoolean,
  IsNumber
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';

import { IsValidDateString } from 'src/modules/utils/decorators';
import { Transform } from 'class-transformer';
import { transformToDate } from 'src/modules/utils/decorators/transform';
import { PERFORMER_STATUSES } from '../constants';
import { ISchedule } from '../dtos';

export class PerformerUpdatePayload {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  isDark?: boolean;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @IsString()
  // @IsNotEmpty()
  @MinLength(6)
  @IsOptional()
  password: string;

  @IsString()
  @IsIn([PERFORMER_STATUSES.ACTIVE, PERFORMER_STATUSES.INACTIVE, PERFORMER_STATUSES.PENDING])
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];

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

  @IsString()
  @IsOptional()
  hair: string;

  @IsString()
  @IsOptional()
  eyes: string;

  @IsString()
  @IsOptional()
  height: string;

  @IsString()
  @IsOptional()
  weight: string;

  @IsString()
  @IsOptional()
  ethnicity: string;

  @IsString()
  @IsOptional()
  pubicHair: string;

  @IsString()
  @IsOptional()
  bust: string;

  @IsString()
  @IsOptional()
  aboutMe: string;

  @IsString()
  @IsOptional()
  sexualReference: string;

  @IsOptional()
  @IsValidDateString()
  @Transform(transformToDate)
  dateOfBirth: Date;

  @IsObject()
  @IsOptional()
  socials?: any;

  @IsBoolean()
  @IsOptional()
  twoFactorAuthenticationEnabled: boolean;

  @IsBoolean()
  @IsOptional()
  isPrivacy: boolean;

  @IsOptional()
  @IsNumber()
  spinWheelPrice?: number;

  @IsOptional()
  badgingId: string;
}

export class AdminUpdatePayload {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @IsOptional()
  isDark: boolean;

  @IsString()
  // @IsNotEmpty()
  @MinLength(6)
  @IsOptional()
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];

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

  @IsString()
  @IsOptional()
  hair: string;

  @IsString()
  @IsOptional()
  eyes: string;

  @IsString()
  @IsOptional()
  height: string;

  @IsString()
  @IsOptional()
  weight: string;

  @IsString()
  @IsOptional()
  ethnicity: string;

  @IsString()
  @IsOptional()
  pubicHair: string;

  @IsString()
  @IsOptional()
  bust: string;

  @IsString()
  @IsOptional()
  aboutMe: string;

  @IsString()
  @IsOptional()
  sexualReference: string;

  @IsOptional()
  @IsValidDateString()
  @Transform(transformToDate)
  dateOfBirth: Date;

  @IsOptional()
  emailVerified?: boolean;

  @IsObject()
  @IsOptional()
  socials?: any;

  @IsOptional()
  verified: boolean;

  @IsString()
  @IsOptional()
  metaTitle: string;

  @IsString()
  @IsOptional()
  metaDescription: string;

  @IsString()
  @IsOptional()
  metaKeyword: string;

  @IsOptional()
  @IsString()
  studioId: string;

  @IsBoolean()
  @IsOptional()
  twoFactorAuthenticationEnabled: boolean;

  @IsBoolean()
  @IsOptional()
  isPrivacy: boolean;

  @IsOptional()
  badgingId: string;
}
