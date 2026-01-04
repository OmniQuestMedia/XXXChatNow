import {
  IsString, IsOptional, IsEnum
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseTipGridItemDto {
  @ApiProperty()
  @IsString()
  tipMenuItemId: string;

  @ApiProperty()
  @IsString()
  performerId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ 
    required: false,
    enum: ['IMMEDIATE', 'QUEUED'],
    default: 'IMMEDIATE',
    description: 'Execution mode: IMMEDIATE for instant processing, QUEUED for deferred processing'
  })
  @IsEnum(['IMMEDIATE', 'QUEUED'])
  @IsOptional()
  executionMode?: 'IMMEDIATE' | 'QUEUED';
}
