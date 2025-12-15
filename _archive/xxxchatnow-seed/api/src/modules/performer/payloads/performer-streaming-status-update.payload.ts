import { IsOptional, IsString } from 'class-validator';

export class PerformerStreamingStatusUpdatePayload {
  @IsString()
  @IsOptional()
  status: string;
}
