import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsArray, 
  IsBoolean, 
  IsNumber, 
  IsOptional, 
  IsString, 
  Min, 
  Max, 
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  MinLength
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MAX_CUSTOM_RESPONSES_PER_BUCKET,
  MIN_CUSTOM_RESPONSES_PER_BUCKET,
  MAX_RESPONSE_LENGTH,
  MIN_RESPONSE_LENGTH
} from '../constants';

export class CustomResponseDto {
  @ApiProperty({
    description: 'ID of the mood bucket',
    example: '507f1f77bcf86cd799439012'
  })
  @IsString()
  bucketId: string;

  @ApiProperty({
    description: 'Array of custom responses',
    example: ['Custom response 1', 'Custom response 2'],
    minItems: MIN_CUSTOM_RESPONSES_PER_BUCKET,
    maxItems: MAX_CUSTOM_RESPONSES_PER_BUCKET
  })
  @IsArray()
  @ArrayMinSize(MIN_CUSTOM_RESPONSES_PER_BUCKET)
  @ArrayMaxSize(MAX_CUSTOM_RESPONSES_PER_BUCKET)
  @IsString({ each: true })
  @MinLength(MIN_RESPONSE_LENGTH, { each: true })
  @MaxLength(MAX_RESPONSE_LENGTH, { each: true })
  responses: string[];
}

export class MoodMessagingSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable/disable auto-responses',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  autoRespond?: boolean;

  @ApiPropertyOptional({
    description: 'Delay in seconds before auto-respond',
    example: 2,
    minimum: 0,
    maximum: 60,
    default: 2
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  responseDelay?: number;

  @ApiPropertyOptional({
    description: 'Maximum auto-responses per day',
    example: 100,
    minimum: 0,
    maximum: 1000,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  dailyLimit?: number;
}

export class UpdateModelConfigDto {
  @ApiPropertyOptional({
    description: 'Array of enabled mood bucket IDs',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledBuckets?: string[];

  @ApiPropertyOptional({
    description: 'Custom responses for specific buckets',
    type: [CustomResponseDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomResponseDto)
  customResponses?: CustomResponseDto[];

  @ApiPropertyOptional({
    description: 'Mood messaging settings',
    type: MoodMessagingSettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoodMessagingSettingsDto)
  settings?: MoodMessagingSettingsDto;
}
