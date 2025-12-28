import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional, IsISO8601 } from 'class-validator';

/**
 * Wallet Balance DTO
 */
export class WalletBalanceDto {
  @ApiProperty({ description: 'User credit balance' })
  @IsNumber()
  balance: number;

  @ApiProperty({ description: 'Whether wallet is verified' })
  @IsBoolean()
  walletVerified: boolean;

  @ApiProperty({ description: 'Wallet verification timestamp', required: false })
  @IsISO8601()
  @IsOptional()
  walletVerifiedAt?: Date;

  @ApiProperty({ description: 'User currency', default: 'USD' })
  currency?: string;
}

/**
 * Wallet Verification Status DTO
 */
export class WalletVerificationStatusDto {
  @ApiProperty({ description: 'Whether wallet is verified' })
  @IsBoolean()
  verified: boolean;

  @ApiProperty({ description: 'Verification timestamp', required: false })
  @IsISO8601()
  @IsOptional()
  verifiedAt?: Date;
}
