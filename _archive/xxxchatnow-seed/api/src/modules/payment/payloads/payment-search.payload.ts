import {
  IsString, IsOptional, IsMongoId, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { IsValidDateString } from 'src/modules/utils/decorators';

export class PaymentSearchPayload extends SearchRequest {
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
  targetId: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  target: string;

  @IsString()
  @IsOptional()
  paymentGateway: string;

  @IsOptional()
  @IsValidDateString()
  fromDate: Date;

  @IsOptional()
  @IsValidDateString()
  toDate: Date;
}
