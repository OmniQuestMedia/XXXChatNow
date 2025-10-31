import {
  IsNotEmpty, IsNumber, IsOptional, IsString
} from 'class-validator';

export class PerformerCommissionPayload {
  @IsNumber()
  @IsOptional()
  tipCommission: number;

  @IsNumber()
  @IsOptional()
  privateCallCommission: number;

  @IsNumber()
  @IsOptional()
  groupCallCommission: number;

  @IsNumber()
  @IsOptional()
  productCommission: number;

  @IsNumber()
  @IsOptional()
  albumCommission: number;

  @IsNumber()
  @IsOptional()
  videoCommission: number;

  @IsNumber()
  @IsOptional()
  spinWheelCommission: number;
}

export class AdminPerformerCommissionPayload extends PerformerCommissionPayload {
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @IsNumber()
  @IsOptional()
  tipCommission: number;

  @IsNumber()
  @IsOptional()
  privateCallCommission: number;

  @IsNumber()
  @IsOptional()
  groupCallCommission: number;

  @IsNumber()
  @IsOptional()
  productCommission: number;

  @IsNumber()
  @IsOptional()
  albumCommission: number;

  @IsNumber()
  @IsOptional()
  videoCommission: number;
}
