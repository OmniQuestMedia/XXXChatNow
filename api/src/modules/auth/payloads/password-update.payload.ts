import {
  IsString, MinLength, IsNotEmpty, IsOptional, MaxLength
} from 'class-validator';

export class PasswordChangePayload {
  @IsString()
  @IsOptional()
  source = 'user';

  @IsOptional()
  @IsString()
  type = 'email';

  @IsString()
  @MinLength(6)
  @MaxLength(14)
  @IsNotEmpty()
  password: string;

  @IsString()
  @MinLength(6)
  @MaxLength(14)
  @IsNotEmpty()
  prePassword: string;
}

export class PasswordUserChangePayload {
  @IsOptional()
  @IsString()
  type = 'email';

  @IsOptional()
  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  userId: string;

  @IsString()
  @MinLength(6)
  @MaxLength(14)
  @IsNotEmpty()
  password: string;
}
