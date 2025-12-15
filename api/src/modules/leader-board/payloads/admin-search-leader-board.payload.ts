import { SearchRequest } from 'src/kernel';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AdminSearchLeaderBoardPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  @IsIn(['last_day', 'last_week', 'last_month', 'last_year'])
  duration: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status: string;
}
