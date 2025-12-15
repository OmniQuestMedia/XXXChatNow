import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class NotificationMessageReadPayload {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  recipientId: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  conversationId: string;
}
