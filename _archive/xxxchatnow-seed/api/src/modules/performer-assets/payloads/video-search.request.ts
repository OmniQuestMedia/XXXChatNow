import {
  IsString, IsOptional, IsMongoId, IsIn, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class VideoSearchRequest extends SearchRequest {
  @IsOptional()
  @IsString()
  @IsMongoId()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive'])
  @ValidateIf((o) => !!o.status)
  status: string;

  @IsOptional()
  isSaleVideo: boolean;
}
