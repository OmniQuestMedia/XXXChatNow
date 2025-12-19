import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsOptional,
  Validate,
  IsIn
} from 'class-validator';

import { Username } from 'src/modules/user/validators/username.validator';
import { GENDERS } from 'src/modules/user/constants';

export class UserRegisterPayload {
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
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @Validate(Username)
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  @IsIn(GENDERS)
  gender: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: Date;

  @IsOptional()
  @IsString()
  rel: string;
}
