import {
  IsEmail, IsIn, IsNotEmpty, IsString
} from 'class-validator';

export class ResendVerificationEmailPaload {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsIn(['performer', 'studio', 'user'])
  @IsNotEmpty()
  source: string;
}
