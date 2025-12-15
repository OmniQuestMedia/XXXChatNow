import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsBoolean,
  Min,
  Max
} from 'class-validator';

export class GalleryUpdatePayload {
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
}
