/**
 * SM-Queue Payloads
 * 
 * Request validation payloads for queue management.
 */

import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsMongoId,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinQueuePayload {
  @ApiProperty({
    description: 'Model/Performer ID to play with',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsMongoId()
  performerId: string;

  @ApiProperty({
    description: 'Entry fee in tokens',
    example: 100,
    minimum: 1
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  entryFee: number;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate entries',
    example: 'idempotency_1234567890_abc'
  })
  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;
}

export class LeaveQueuePayload {
  @ApiProperty({
    description: 'Model/Performer ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsMongoId()
  performerId: string;

  @ApiProperty({
    description: 'Reason for leaving',
    example: 'user_left',
    required: false
  })
  @IsString()
  reason?: string;
}

export class GetQueueStatusPayload {
  @ApiProperty({
    description: 'Model/Performer ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsMongoId()
  performerId: string;
}

export class StartGamePayload {
  @ApiProperty({
    description: 'Model/Performer ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsMongoId()
  performerId: string;
}
