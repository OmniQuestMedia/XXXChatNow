import { IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class CategorySearchRequestPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  name: string;
}
