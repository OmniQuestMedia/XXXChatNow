import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsMongoId
} from 'class-validator';

export class PhotoCreatePayload {
  @IsOptional()
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  performerId: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  galleryId: string;
}
