import {
  IsString, IsOptional, IsMongoId, ValidateIf
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common';
import { IsValidDateString } from 'src/modules/utils/decorators';

export class OrderSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.buyerId)
  buyerId: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => !!o.sellerId)
  sellerId: string;

  @IsString()
  @IsOptional()
  deliveryStatus: string;

  @IsOptional()
  @IsValidDateString()
  fromDate: Date;

  @IsOptional()
  @IsValidDateString()
  toDate: Date;
}
