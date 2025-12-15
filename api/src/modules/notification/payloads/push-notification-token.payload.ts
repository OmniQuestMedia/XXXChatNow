import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class PushNotificationTokenPayload {
  @IsOptional()
  @IsString()
  userAgent: string;

  @IsNotEmpty()
  @IsString()
  registrationToken: string;

  constructor(userAgent?: string, registrationToken?: string) {
    this.userAgent = userAgent;
    this.registrationToken = registrationToken;
  }
}

export class PushNotificationTokenSearchPayload extends SearchRequest { }
