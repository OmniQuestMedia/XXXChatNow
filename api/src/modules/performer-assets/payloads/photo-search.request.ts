import {
  IsString, IsOptional, IsMongoId, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class PhotoSearchRequest extends SearchRequest {
  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.galleryId)
  galleryId: string;

  @IsString()
  @IsOptional()
  status: string;
}
