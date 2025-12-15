import {
  IsString,
  IsOptional
} from 'class-validator';

export class UserNotificationPayload {
  @IsString()
  @IsOptional()
  performerId: string;
}
