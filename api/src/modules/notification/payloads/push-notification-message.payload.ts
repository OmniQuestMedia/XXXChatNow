import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PushNotificationMessage {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  notificationLink: string;
}
