import {
  IsString, IsOptional, IsBooleanString, IsMongoId, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class PerformerSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  gender: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !!o.category)
  category: string;

  @IsString()
  @IsOptional()
  tags: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.studioId)
  studioId: string;

  @IsBooleanString()
  @IsOptional()
  isOnline: boolean;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.excludedId)
  excludedId: string;

  @IsOptional()
  @IsString()
  performerType: string;
}
