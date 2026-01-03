import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GetPrivateMoodMessageDto {
  @ApiProperty({
    description: 'User membership tier key',
    example: 'gold_vip',
    required: false
  })
  @IsOptional()
  @IsString()
  tierKey?: string;

  @ApiProperty({
    description: 'Username to substitute in message',
    example: 'JohnDoe'
  })
  @IsNotEmpty()
  @IsString()
  username: string;
}

export class MoodMessageResponseDto {
  @ApiProperty({
    description: 'The mood message with placeholders substituted',
    example: 'Hey JohnDoe! You\'re adorable 🥰'
  })
  message: string;

  @ApiProperty({
    description: 'The bucket key used',
    example: 'cute'
  })
  bucketKey?: string;
}

export class PublicMicroGratitudeResponseDto {
  @ApiProperty({
    description: 'The public gratitude message',
    example: 'Thanks babe 😘'
  })
  message: string;
}

export class AvailableBucketsResponseDto {
  @ApiProperty({
    description: 'List of available bucket keys for the tier',
    example: ['cute', 'flirty', 'playful']
  })
  buckets: string[];

  @ApiProperty({
    description: 'Whether the tier has secondary micro access',
    example: true
  })
  hasSecondaryMicro: boolean;
}
