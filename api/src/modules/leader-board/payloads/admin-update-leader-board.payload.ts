import {
  IsIn, IsNotEmpty, IsOptional, IsString
} from 'class-validator';

export class LeaderBoardUpdatePayload {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['last_day', 'last_week', 'last_month', 'last_year'])
  duration: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status: string;
}
