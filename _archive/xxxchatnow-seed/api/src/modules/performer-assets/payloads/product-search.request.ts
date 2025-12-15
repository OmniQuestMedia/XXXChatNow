import {
  IsString, IsOptional, IsMongoId, IsBooleanString, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class ProductSearchRequest extends SearchRequest {
  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsOptional()
  @IsBooleanString()
  publish: boolean;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.productId)
  productId: string;

  @IsString()
  @IsOptional()
  type: string;
}
