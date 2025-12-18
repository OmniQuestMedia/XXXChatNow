import { IsInt, IsPositive, IsBoolean, IsOptional, Min } from 'class-validator';

export class UpdateTokenBundleDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  tokens?: number;

  @IsInt()
  @IsPositive()
  @Min(1, { message: 'Price must be at least 1 cent' })
  @IsOptional()
  priceUsd?: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
