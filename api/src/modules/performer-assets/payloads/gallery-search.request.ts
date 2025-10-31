import {
  IsString, IsOptional, IsBoolean, IsMongoId, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class GallerySearchRequest extends SearchRequest {
  @IsString()
  @IsMongoId()
  @IsOptional()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsBoolean()
  @IsOptional()
  isSale: boolean;
}
