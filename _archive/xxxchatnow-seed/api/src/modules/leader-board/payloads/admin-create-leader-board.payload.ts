import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class LeaderBoardCreatePayload {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['last_day', 'last_week', 'last_month', 'last_year'])
  duration: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['favorites', 'totalSpent', 'totalEarned']) // nếu bạn muốn giới hạn giá trị hợp lệ cho type
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status: string;
}
