import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsIn,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { UserCreatePayload } from './user-create.payload';
import { STATUS, ROLE_USER, ROLE_ADMIN } from '../constants';

export class UserAuthCreatePayload extends UserCreatePayload {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsArray()
  @IsOptional()
  @IsIn([ROLE_ADMIN, ROLE_USER], { each: true })
  roles: string[];

  @IsString()
  @IsIn([STATUS.ACTIVE, STATUS.INACTIVE, STATUS.PENDING])
  status: string;

  @IsNumber()
  @IsOptional()
  balance: number;

  @IsBoolean()
  @IsOptional()
  emailVerified: boolean;
}
