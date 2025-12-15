import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CategoryUpdatePayload {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug: string;

  @IsNumber()
  ordering: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  metaTitle: string;

  @IsString()
  @IsOptional()
  metaDescription: string;

  @IsString()
  @IsOptional()
  metaKeyword: string;
}
