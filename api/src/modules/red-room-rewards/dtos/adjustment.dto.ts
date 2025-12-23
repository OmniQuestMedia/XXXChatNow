/**
 * RedRoomRewards Adjustment DTOs
 * 
 * Data transfer objects for manual adjustments and CS credits
 */

import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ReasonCode } from '../constants';

export class ManualAdjustmentDto {
  @IsString()
  memberId: string;

  @IsNumber()
  amount: number; // positive for credit, negative for debit

  @IsEnum(ReasonCode)
  reasonCode: string;

  @IsString()
  adminActorId: string;

  @IsOptional()
  @IsString()
  ticketReference?: string;

  @IsOptional()
  @IsString()
  privateNote?: string;

  @IsOptional()
  @IsString()
  secondAdminId?: string; // for amounts 101-500

  @IsOptional()
  @IsString()
  rrrAdminId?: string; // for amounts > 500

  @IsString()
  idempotencyKey: string;
}

export class AdjustmentResponseDto {
  ledgerEntryId: string;
  memberId: string;
  amount: number;
  balanceAfter: number;
  reasonCode: string;
  createdAt: Date;
  message?: string;
}
