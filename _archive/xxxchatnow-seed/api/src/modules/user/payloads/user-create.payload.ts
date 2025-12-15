import {
  IsString,
  IsOptional,
  IsEmail,
  Validate,
  IsIn,
  IsNotEmpty,
  IsNumber
} from 'class-validator';
import { IsValidDateString } from 'src/modules/utils/decorators';
import { transformToDate } from 'src/modules/utils/decorators/transform';
import { Transform } from 'class-transformer';
import { Username } from '../validators/username.validator';
import { GENDERS } from '../constants';

export class UserCreatePayload {
  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsIn(GENDERS)
  gender: string;

  @IsString()
  country: string;

  @IsNotEmpty()
  @IsValidDateString()
  @Transform(transformToDate)
  dateOfBirth: Date;

  @IsNumber()
  @IsOptional()
  balance: number;
}
