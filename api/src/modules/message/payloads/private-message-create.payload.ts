import {
  IsString,
  IsNotEmpty,
  IsMongoId
} from 'class-validator';
import { MessageCreatePayload } from './message-create.payload';

export class PrivateMessageCreatePayload extends MessageCreatePayload {
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  recipientId: string;

  @IsNotEmpty()
  @IsString()
  recipientType: string;
}
