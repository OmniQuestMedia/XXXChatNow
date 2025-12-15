import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsMongoId
} from 'class-validator';

export class GalleryCreatePayload {
  @IsOptional()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive'])
  status: string;

  @IsBoolean()
  @IsOptional()
  isSale: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(9999999)
  token: number;

  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  performerId: string;
}
