import {
  IsString, IsOptional, IsMongoId, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';

export class PaymentTokenSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  source: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.sourceId)
  sourceId: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => o.targetId)
  targetId: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.sellerId)
  sellerId: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  target: string;

  @IsOptional()
  fromDate: Date;

  @IsOptional()
  toDate: Date;

  @IsOptional()
  @IsString()
  shippingStatus: string;

  @IsOptional()
  @IsString()
  orderStatus: string;
}
