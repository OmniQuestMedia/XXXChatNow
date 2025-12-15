import { SearchRequest } from 'src/kernel';
import { IsOptional, IsString } from 'class-validator';

export class AdminSearch extends SearchRequest {
  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  type = 'post';
}
