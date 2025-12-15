import { IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class WheelSearchRequestPayload extends SearchRequest {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  performerId: string;
}
