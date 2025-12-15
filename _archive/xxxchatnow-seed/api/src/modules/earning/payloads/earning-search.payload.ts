import { SearchRequest } from 'src/kernel/common';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  // IsISO8601,
  IsMongoId,
  ValidateIf
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { PURCHASE_ITEM_TYPE } from 'src/modules/purchased-item/constants';
import { IsValidDateString } from 'src/modules/utils/decorators';

export class EarningSearchRequestPayload extends SearchRequest {
  @IsOptional()
  @IsString()
  performerType: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  @ValidateIf((o) => !!o.performerId)
  performerId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  @ValidateIf((o) => !!o.sourceId)
  sourceId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  @ValidateIf((o) => !!o.targetId)
  targetId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  @ValidateIf((o) => !!o.studioId)
  studioId: string;

  @IsOptional()
  @IsString()
  @IsIn([
    PURCHASE_ITEM_TYPE.GROUP,
    PURCHASE_ITEM_TYPE.PHOTO,
    PURCHASE_ITEM_TYPE.PRIVATE,
    PURCHASE_ITEM_TYPE.PRODUCT,
    PURCHASE_ITEM_TYPE.SALE_VIDEO,
    PURCHASE_ITEM_TYPE.TIP
  ])
  type: string;

  @IsOptional()
  @IsString()
  @IsIn(['performer', 'studio', 'user'])
  source: string;

  @IsOptional()
  @IsString()
  @IsIn(['performer', 'studio', 'user'])
  target: string;

  @IsOptional()
  // @IsISO8601()
  fromDate: Date;

  @IsOptional()
  // @IsISO8601()
  toDate: Date;

  @IsOptional()
  @IsValidDateString()
  paidAt: Date;

  @IsOptional()
  @IsBoolean()
  isPaid: boolean;

  @IsOptional()
  @IsString()
  payoutStatus: string;
}

export interface UpdateEarningStatusPayload {
  targetId: ObjectId;
  fromDate: Date;
  toDate: Date;
}
