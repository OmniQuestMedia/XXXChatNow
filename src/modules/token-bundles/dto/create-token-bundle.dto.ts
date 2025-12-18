import { IsEnum, IsInt, IsPositive, IsBoolean, IsOptional, Min } from 'class-validator';
import { UserTier } from '../entities/token-bundle.entity';

export class CreateTokenBundleDto {
  @IsEnum(UserTier)
  tier: UserTier;

  @IsInt()
  @IsPositive()
  tokens: number;

  @IsInt()
  @IsPositive()
  @Min(1, { message: 'Price must be at least 1 cent' })
  priceUsd: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
