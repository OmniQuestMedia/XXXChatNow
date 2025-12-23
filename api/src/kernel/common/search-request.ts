import {
  IsString, IsOptional, IsInt
} from 'class-validator';
import { Optional } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { SortOrder } from 'mongoose';

export class SearchRequest {
  @IsOptional()
  @IsString()
  q = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Transform(({ value }) => {
    if (!value) return 10;
    if (value > 200) return 200;
    return value;
  })
  limit = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Transform(({ value }) => {
    if (!value || value < 0) return 0;
    return value;
  })
  offset = 0;

  @Optional()
  @IsString()
  sortBy = 'updatedAt';

  @Optional()
  @IsString()
  @Transform(({ value }) => {
    if (value !== 'asc') return 'desc';
    return 'asc';
  })
  sort: SortOrder = 'desc';
}
