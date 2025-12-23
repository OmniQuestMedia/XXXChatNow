/**
 * RedRoomRewards Transfer DTOs
 * 
 * Data transfer objects for transfer operations
 */

import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class InitiateTransferDto {
  @IsString()
  receiverMemberId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  idempotencyKey: string; // required for idempotent operations

  @IsOptional()
  @IsString()
  deviceClusterHash?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class InitiateModelAwardDto {
  @IsString()
  viewerMemberId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  streamId: string; // stream/room identifier

  @IsString()
  sessionProof: string; // proof that viewer is in stream

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReverseTransferDto {
  @IsString()
  transferId: string;

  @IsString()
  reasonCode: string;

  @IsString()
  adminActorId: string;

  @IsOptional()
  @IsString()
  privateNote?: string;
}

export class TransferResponseDto {
  transferId: string;
  status: string;
  senderMemberId: string;
  receiverMemberId: string;
  amount: number;
  createdAt: Date;
  completedAt?: Date;
  message?: string;
}
