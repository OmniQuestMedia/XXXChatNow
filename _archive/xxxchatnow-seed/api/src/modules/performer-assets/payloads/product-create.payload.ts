import {
  IsString,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsBooleanString,
  IsNumberString,
  IsMongoId
} from 'class-validator';
import { PRODUCT_STATUS, PRODUCT_TYPE } from '../constants';

export class ProductCreatePayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  @IsIn([PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE])
  status: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([PRODUCT_TYPE.DIGITAL, PRODUCT_TYPE.PHYSICAL])
  type: string;

  @IsNumberString()
  @IsNotEmpty()
  token: number;

  @IsNumberString()
  @IsOptional()
  stock: number;

  @IsBooleanString()
  @IsNotEmpty()
  publish: boolean;

  @IsString()
  @IsOptional()
  @IsMongoId()
  performerId: string;
}
