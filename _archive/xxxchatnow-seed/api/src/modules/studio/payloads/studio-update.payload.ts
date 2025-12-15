import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  MinLength,
  Validate,
  ValidateIf
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { STUDIO_STATUES } from '../constants';

export class StudioUpdatePayload {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
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
  @IsIn([
    STUDIO_STATUES.ACTIVE,
    STUDIO_STATUES.INACTIVE,
    STUDIO_STATUES.PENDING
  ])
  @IsOptional()
  status: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsBoolean()
  emailVerified: boolean;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.documentVerificationId)
  documentVerificationId: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;
}
