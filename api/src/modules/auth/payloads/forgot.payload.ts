import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPayload {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
