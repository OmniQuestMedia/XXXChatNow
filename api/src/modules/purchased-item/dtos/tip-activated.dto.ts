import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsISO8601, IsNumber, IsObject } from 'class-validator';

/**
 * Ledger information from RRR (RedRoomRewards) API
 * This is the source of truth for tip activation
 */
export class TipActivatedLedgerDto {
  @ApiProperty({ description: 'RRR ledger entry ID (entry_id)' })
  @IsString()
  @IsNotEmpty()
  ledgerId: string;

  @ApiProperty({ description: 'RRR source reference (source_ref)' })
  @IsString()
  @IsNotEmpty()
  sourceRef: string;

  @ApiProperty({ description: 'Debit-side entry_id (null if only one entry)', nullable: true })
  @IsString()
  @IsOptional()
  debitRef: string | null;

  @ApiProperty({ description: 'Credit-side entry_id (null if only one entry)', nullable: true })
  @IsString()
  @IsOptional()
  creditRef: string | null;

  @ApiProperty({ description: 'Ledger status - always SETTLED when posted_at is set' })
  @IsString()
  @IsNotEmpty()
  status: 'SETTLED';

  @ApiProperty({ description: 'ISO 8601 timestamp when ledger entry was posted' })
  @IsISO8601()
  @IsNotEmpty()
  postedAt: string;
}

/**
 * TipActivated event payload
 * Emitted when a tip transaction is finalized and confirmed by RRR ledger
 */
export class TipActivatedDto {
  @ApiProperty({ description: 'Unique tip transaction ID (MongoDB ObjectId)' })
  @IsString()
  @IsNotEmpty()
  tipId: string;

  @ApiProperty({ description: 'User ID who sent the tip' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Performer ID who received the tip' })
  @IsString()
  @IsNotEmpty()
  performerId: string;

  @ApiProperty({ description: 'Conversation ID where tip was sent' })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ description: 'Tip amount in tokens' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'RRR ledger information (source of truth)' })
  @IsObject()
  @IsNotEmpty()
  ledger: TipActivatedLedgerDto;

  @ApiProperty({ description: 'ISO 8601 timestamp when tip was created' })
  @IsISO8601()
  @IsNotEmpty()
  createdAt: string;
}
