import { IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class StudioSearchPayload extends SearchRequest {
  @IsOptional()
  @IsString()
  studioId: string;

  @IsString()
  @IsOptional()
  status: string;
}
