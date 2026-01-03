import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsISO8601, IsOptional } from 'class-validator';

/**
 * TipActivated Event DTO
 * Emitted when a tip is activated after successful payment and RRR ledger settlement
 */
export class TipActivatedEventDto {
  @ApiProperty({ description: 'Tip ID - string form of PurchasedItem._id' })
  @IsString()
  tipId: string;

  @ApiProperty({ description: 'Event ID - unique UUID for this emission' })
  @IsString()
  eventId: string;

  @ApiProperty({ description: 'User ID who sent the tip' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Performer ID who received the tip' })
  @IsString()
  performerId: string;

  @ApiProperty({ description: 'Tip amount in tokens' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Conversation ID where tip was sent' })
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Timestamp when tip was created' })
  @IsISO8601()
  createdAt: string;

  @ApiProperty({ description: 'RRR ledger entry ID' })
  @IsString()
  @IsOptional()
  ledgerEntryId?: string;

  @ApiProperty({ description: 'RRR source reference (deterministic: purchasedItem:{_id})' })
  @IsString()
  ledgerSourceRef: string;

  @ApiProperty({ description: 'RRR ledger posted timestamp (SETTLED when not null)' })
  @IsISO8601()
  @IsOptional()
  ledgerPostedAt?: string;
}
