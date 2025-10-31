import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsIn,
  IsMongoId,
  ValidateIf
} from 'class-validator';
import {
  PUBLIC_CHAT,
  PRIVATE_CHAT,
  GROUP_CHAT
} from 'src/modules/stream/constant';

export class SendTipsPayload {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  token: number;

  @IsOptional()
  @IsString()
  @IsIn([PUBLIC_CHAT, PRIVATE_CHAT, GROUP_CHAT])
  roomType: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  @ValidateIf((o) => !!o.conversationId)
  conversationId: string;
}
