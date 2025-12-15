import {
  IsOptional,
  IsNumber,
  Max,
  Min
} from 'class-validator';

export class UpdateCommissionPayload {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tipCommission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  privateCallCommission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  groupCallCommission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  productCommission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  albumCommission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  videoCommission: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  spinWheelCommission: number;
}
