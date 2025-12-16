import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  IsMongoId,
  ValidateIf
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { PostMetaPayload } from './post-meta.payload';

export class PostCreatePayload {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.authorId)
  authorId: string | ObjectId;

  @IsString()
  type = 'post';

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsOptional()
  shortDescription: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[] = [];

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published'])
  status = 'draft';

  @IsString()
  @IsOptional()
  image?: string;

  @IsOptional()
  @ValidateNested()
  meta?: PostMetaPayload[];

  @IsString()
  @IsOptional()
  metaTitle: string;

  @IsString()
  @IsOptional()
  metaDescription: string;

  @IsString()
  @IsOptional()
  metaKeyword: string;

  @IsString()
  @IsOptional()
  canonicalUrl: string;
}
