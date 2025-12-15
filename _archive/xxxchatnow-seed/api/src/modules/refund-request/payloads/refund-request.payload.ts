import {
  IsString, IsOptional, IsNotEmpty, IsNumber, Min, IsIn
} from 'class-validator';

import { ObjectId } from 'mongodb';
import { SearchRequest } from 'src/kernel/common';
import { STATUES } from '../constants';

export class RefundRequestCreatePayload {
  @IsString()
  sourceType = 'order';

  @IsNotEmpty()
  @IsString()
  sourceId: string;

  @IsNotEmpty()
  @IsString()
  performerId: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  token: number;
}

export class RefundRequestUpdatePayload {
  @IsNotEmpty()
  @IsString()
  @IsIn([STATUES.PENDING, STATUES.REJECTED, STATUES.RESOLVED])
  status: string;
}

export class RefundRequestSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  performerId?: string | ObjectId;

  @IsString()
  @IsOptional()
  userId?: string | ObjectId;

  @IsString()
  @IsOptional()
  sourceId?: string | ObjectId;

  @IsString()
  @IsOptional()
  sourceType?: string;

  @IsString()
  @IsOptional()
  fromDate?: string | Date;

  @IsString()
  @IsOptional()
  toDate?: string | Date;

  @IsString()
  @IsOptional()
  status?: string;
}
