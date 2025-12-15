import {
  IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString
} from 'class-validator';
import { SearchRequest } from 'src/kernel';
import { BANKING_TYPE } from '../constants';

export class PaymentInformationPayload {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    BANKING_TYPE.BITPAY,
    BANKING_TYPE.DEPOSIT,
    BANKING_TYPE.ISSUE,
    BANKING_TYPE.PAYONNEER,
    BANKING_TYPE.PAYPAL,
    BANKING_TYPE.WIRE,
    BANKING_TYPE.PAXUM
  ])
  type: string;
}

export class AdminCreatePaymentInformationPayload {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    BANKING_TYPE.BITPAY,
    BANKING_TYPE.DEPOSIT,
    BANKING_TYPE.ISSUE,
    BANKING_TYPE.PAYONNEER,
    BANKING_TYPE.PAYPAL,
    BANKING_TYPE.WIRE,
    BANKING_TYPE.PAXUM
  ])
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  sourceId: string;

  @IsString()
  @IsNotEmpty()
  sourceType: string;
}

export class AdminSearchPaymentInformationPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  @IsIn([
    BANKING_TYPE.BITPAY,
    BANKING_TYPE.DEPOSIT,
    BANKING_TYPE.ISSUE,
    BANKING_TYPE.PAYONNEER,
    BANKING_TYPE.PAYPAL,
    BANKING_TYPE.WIRE,
    BANKING_TYPE.PAXUM
  ])
  type: string;

  @IsString()
  @IsOptional()
  @IsMongoId()
  sourceId: string;

  @IsString()
  @IsOptional()
  sourceType: string;
}
