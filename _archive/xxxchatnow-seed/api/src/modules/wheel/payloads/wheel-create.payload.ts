import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsNumber
} from 'class-validator';
import { WHEEL_STATUS } from '../constants';

export class WheelCreatePayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  time: number;

  @IsNumber()
  @IsOptional()
  ordering: number;

  @IsString()
  @IsOptional()
  color: string;

  @IsString()
  @IsIn([WHEEL_STATUS.ACTIVE, WHEEL_STATUS.INACTIVE])
  @IsOptional()
  status = WHEEL_STATUS.ACTIVE;
}
