import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CategoryCreatePayload {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  type = 'post';

  @IsString()
  @IsOptional()
  slug: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  parentId: string;

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
