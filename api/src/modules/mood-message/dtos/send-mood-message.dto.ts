/**
 * Send Mood Message DTO
 * 
 * Validates user input for sending mood-based messages.
 * All messages are tracked and logged for audit purposes.
 * 
 * Reference: MODEL_MOOD_RESPONSE_SYSTEM.md
 */

import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMoodMessageDto {
  @ApiProperty({
    description: 'Recipient user ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Type of mood message',
    enum: ['public_micro', 'private_custom', 'escalation_auto'],
    example: 'private_custom'
  })
  @IsNotEmpty()
  @IsEnum(['public_micro', 'private_custom', 'escalation_auto'])
  message_type: string;

  @ApiProperty({
    description: 'Message content',
    example: 'I noticed you seem happy today! That\'s wonderful!'
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Detected mood',
    enum: ['happy', 'sad', 'angry', 'neutral', 'excited', 'anxious', 'unknown'],
    example: 'happy'
  })
  @IsNotEmpty()
  @IsEnum(['happy', 'sad', 'angry', 'neutral', 'excited', 'anxious', 'unknown'])
  detected_mood: string;

  @ApiProperty({
    description: 'Confidence score for mood detection (0-100)',
    example: 87,
    minimum: 0,
    maximum: 100
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  mood_confidence: number;

  @ApiProperty({
    description: 'Message priority (1-10, higher is more urgent)',
    example: 8,
    minimum: 1,
    maximum: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({
    description: 'Optional template ID if using a template',
    example: '507f1f77bcf86cd799439012',
    required: false
  })
  @IsOptional()
  @IsString()
  template_id?: string;

  @ApiProperty({
    description: 'Optional conversation ID to group related messages',
    example: 'conv-uuid-v4',
    required: false
  })
  @IsOptional()
  @IsString()
  conversation_id?: string;

  @ApiProperty({
    description: 'Optional metadata for tracking',
    example: { source: 'chatbot', session_id: 'xyz' },
    required: false
  })
  @IsOptional()
  metadata?: any;
}
