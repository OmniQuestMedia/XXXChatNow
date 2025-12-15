import {
  IsString, MinLength, IsNotEmpty, IsOptional
} from 'class-validator';

export class LoginPayload {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsOptional()
  remember: boolean;
}
