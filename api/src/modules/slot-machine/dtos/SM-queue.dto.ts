/**
 * SM-Queue DTOs
 * 
 * Data transfer objects for queue management endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class SMQueueEntryDto {
  @ApiProperty()
  queueId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  performerId: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  entryFee: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  estimatedWaitTimeMs?: number;
}

export class SMQueueStatusDto {
  @ApiProperty()
  performerId: string;

  @ApiProperty()
  queueLength: number;

  @ApiProperty()
  hasActiveSession: boolean;

  @ApiProperty()
  userPosition: number | null;

  @ApiProperty()
  estimatedWaitTimeMs: number | null;

  @ApiProperty()
  canJoin: boolean;

  @ApiProperty()
  reason?: string;
}

export class SMGameSessionDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  performerId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  betAmount: number;

  @ApiProperty()
  totalSpins: number;

  @ApiProperty()
  totalWinnings: number;

  @ApiProperty()
  totalLosses: number;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  durationMs?: number;
}

export class SMPayoutTransactionDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  balanceBefore?: number;

  @ApiProperty()
  balanceAfter?: number;

  @ApiProperty()
  initiatedAt: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty()
  prizeData?: any;
}
