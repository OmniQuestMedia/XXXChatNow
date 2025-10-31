import {
  IsString,
  IsOptional,
  IsEmail,
  Validate,
  IsIn,
  IsNotEmpty,
  IsTimeZone,
  IsBoolean
} from 'class-validator';
import { IsValidDateString } from 'src/modules/utils/decorators';
import { transformToDate } from 'src/modules/utils/decorators/transform';
import { Transform } from 'class-transformer';
import { Username } from '../validators/username.validator';
import { GENDERS } from '../constants';

export class UserUpdatePayload {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  isDark: boolean;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @Validate(Username)
  username: string;

  @IsString()
  @IsIn(GENDERS)
  gender: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  @IsTimeZone()
  timezone: string;

  @IsNotEmpty()
  @IsValidDateString()
  @Transform(transformToDate)
  dateOfBirth: Date;

  @IsBoolean()
  @IsOptional()
  enableGhostMode: boolean;

  @IsBoolean()
  @IsOptional()
  twoFactorAuthenticationEnabled: boolean;

  @IsBoolean()
  @IsOptional()
  isPrivacy: boolean;
}
