import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsISO8601,
  IsNumber
} from 'class-validator';

import { SearchRequest } from 'src/kernel/common';
import { STATUES, SOURCE_TYPE } from '../constants';

export class PayoutRequestCreatePayload {
  @IsString()
  @IsNotEmpty()
  paymentAccountType: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([SOURCE_TYPE.PERFORMER, SOURCE_TYPE.STUDIO])
  sourceType: string;

  @IsNotEmpty()
  fromDate: Date;

  @IsNotEmpty()
  toDate: Date;

  @IsOptional()
  requestNote: string;
}

export class PayoutRequestUpdatePayload {
  @IsNotEmpty()
  @IsString()
  @IsIn([STATUES.PENDING, STATUES.REJECTED, STATUES.DONE, STATUES.APPROVED])
  status: string;

  @IsOptional()
  adminNote: string;

  @IsNotEmpty()
  @IsNumber()
  conversionRate: number;
}

export class PayoutRequestSearchPayload extends SearchRequest {
  @IsOptional()
  @IsString()
  performerId: string;

  @IsOptional()
  @IsString()
  studioId: string;

  @IsOptional()
  @IsString()
  sourceId: string;

  @IsOptional()
  @IsString()
  paymentAccountType?: string;

  @IsOptional()
  @IsISO8601()
  fromDate: Date;

  @IsOptional()
  @IsISO8601()
  toDate: Date;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  sourceType: string;
}
