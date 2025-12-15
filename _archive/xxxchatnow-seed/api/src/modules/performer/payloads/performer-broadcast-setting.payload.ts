import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class PerformerBroadcastSetting {
  @IsOptional()
  @IsNumber()
  maxParticipantsAllowed: number;

  @IsOptional()
  @IsNumber()
  peekInTimeLimit: number;

  @IsOptional()
  @IsNumber()
  peekInPrice: number;

  @IsOptional()
  @IsBoolean()
  enablePeekIn: boolean;
}
