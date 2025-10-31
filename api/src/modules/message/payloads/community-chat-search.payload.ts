import { IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class CommunityChatSearchPayload extends SearchRequest {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  performerId: string;
}
