/**
 * Queue Request DTOs
 * 
 * Data Transfer Objects for queue request operations
 */

import { IsString, IsEnum, IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QUEUE_MODE, PRIORITY_LEVEL } from '../constants';

export class SubmitQueueRequestDto {
  @ApiProperty({ description: 'Type of request being queued', example: 'chat.message' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Queue mode', enum: Object.values(QUEUE_MODE), default: QUEUE_MODE.FIFO })
  @IsEnum(QUEUE_MODE)
  @IsOptional()
  mode?: string;

  @ApiProperty({ description: 'Request payload data', required: false })
  @IsObject()
  @IsOptional()
  payload?: any;

  @ApiProperty({ description: 'Priority level (1-20, higher = more urgent)', minimum: 1, maximum: 20, default: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Idempotency key to prevent duplicate processing', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class QueueRequestResponseDto {
  @ApiProperty({ description: 'Unique request identifier' })
  requestId: string;

  @ApiProperty({ description: 'Request status' })
  status: string;

  @ApiProperty({ description: 'Queue mode' })
  mode: string;

  @ApiProperty({ description: 'Request type' })
  type: string;

  @ApiProperty({ description: 'Priority level' })
  priority: number;

  @ApiProperty({ description: 'Timestamp when request was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Estimated position in queue', required: false })
  queuePosition?: number;
}

export class QueueRequestStatusDto {
  @ApiProperty({ description: 'Request identifier' })
  requestId: string;

  @ApiProperty({ description: 'Current status' })
  status: string;

  @ApiProperty({ description: 'Retry count' })
  retryCount: number;

  @ApiProperty({ description: 'Worker ID processing this request', required: false })
  workerId?: string;

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string;

  @ApiProperty({ description: 'Processing result if completed', required: false })
  result?: any;

  @ApiProperty({ description: 'Timestamp when request was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when request was completed', required: false })
  completedAt?: Date;
}
