import {
  IsString, IsOptional, IsIn, IsNotEmpty, IsMongoId
} from 'class-validator';

export class VideoCreatePayload {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;

  @IsOptional()
  isSaleVideo: boolean;

  // @IsNumber()
  @IsOptional()
  token: number;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  performerId: string;
}
