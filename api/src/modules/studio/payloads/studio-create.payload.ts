import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  Validate
} from 'class-validator';
import { Username } from 'src/modules/user/validators/username.validator';
import { STUDIO_STATUES } from '../constants';

export class StudioCreatePayload {
  @IsNotEmpty()
  @IsString()
  @Validate(Username)
  username: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class StudioCreateByAdminPayload {
  @IsNotEmpty()
  @IsString()
  @Validate(Username)
  username: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  documentVerificationId: any;

  @IsNumber()
  @IsOptional()
  commission: number;

  @IsString()
  @IsIn([
    STUDIO_STATUES.ACTIVE,
    STUDIO_STATUES.INACTIVE,
    STUDIO_STATUES.PENDING
  ])
  @IsOptional()
  status: string;

  @IsBoolean()
  @IsOptional()
  emailVerified: boolean;
}
