import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsNumber, Min } from 'class-validator';

export enum MessageType {
  TIP = 'tip',
  GIFT = 'gift',
  MESSAGE = 'message',
  GREETING = 'greeting',
  FOLLOW = 'follow'
}

export class MessageContextDto {
  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TIP
  })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiPropertyOptional({
    description: 'Amount for tips/gifts',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class SelectMoodResponseDto {
  @ApiProperty({
    description: 'Name of the mood bucket to select from',
    example: 'happy',
    enum: [
      'happy',
      'sad',
      'angry',
      'neutral',
      'tip_gratitude',
      'gift_gratitude',
      'general_gratitude',
      'new_follower_gratitude'
    ]
  })
  @IsString()
  bucketName: string;

  @ApiPropertyOptional({
    description: 'ID of the performer (optional, uses authenticated user if not provided)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  performerId?: string;

  @ApiPropertyOptional({
    description: 'Optional context information',
    type: MessageContextDto
  })
  @IsOptional()
  @IsObject()
  context?: MessageContextDto;
}
