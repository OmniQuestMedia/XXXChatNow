import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { MoodMessagingService } from '../services';
import {
  GetPrivateMoodMessageDto,
  MoodMessageResponseDto,
  PublicMicroGratitudeResponseDto,
  AvailableBucketsResponseDto
} from '../dtos';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('mood-messaging')
@Controller('mood-messaging')
export class MoodMessagingController {
  constructor(private readonly moodMessagingService: MoodMessagingService) {}

  @Get('private-mood')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a private mood message',
    description: 'Returns a personalized mood message based on user tier with non-repetitive selection'
  })
  @ApiResponse({
    status: 200,
    description: 'Mood message retrieved successfully',
    type: MoodMessageResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getPrivateMoodMessage(
    @CurrentUser() user: any,
    @Query() query: GetPrivateMoodMessageDto
  ): Promise<MoodMessageResponseDto> {
    let tierKey: unknown = query.tierKey || 'guest';
    if (typeof tierKey !== 'string') {
      throw new BadRequestException('tierKey must be a string');
    }
    tierKey = tierKey.trim();
    if (!tierKey) {
      tierKey = 'guest';
    }
    // Use provided username, or fall back to user's actual username, or user's first name, or 'friend' as last resort
    const username = query.username || user.username || user.firstName || 'friend';

    const result = await this.moodMessagingService.getPrivateMoodMessage(
      user._id,
      tierKey as string,
      username
    );

    return {
      message: result.message,
      bucketKey: result.bucketKey
    };
  }

  @Get('public-gratitude')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a public micro-gratitude message',
    description: 'Returns a public gratitude message with non-repetitive selection (5 message cycle)'
  })
  @ApiResponse({
    status: 200,
    description: 'Gratitude message retrieved successfully',
    type: PublicMicroGratitudeResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getPublicGratitudeMessage(
    @CurrentUser() user: any
  ): Promise<PublicMicroGratitudeResponseDto> {
    const message = await this.moodMessagingService.getPublicMicroGratitudeMessage(user._id);

    return {
      message
    };
  }

  @Get('available-buckets')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available buckets for a tier',
    description: 'Returns the list of mood buckets available for a specific tier'
  })
  @ApiResponse({
    status: 200,
    description: 'Available buckets retrieved successfully',
    type: AvailableBucketsResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async getAvailableBuckets(
    @Query('tierKey') rawTierKey = 'guest'
  ): Promise<AvailableBucketsResponseDto> {
    let tierKey: unknown = rawTierKey;
    if (typeof tierKey !== 'string') {
      throw new BadRequestException('tierKey must be a string');
    }
    tierKey = tierKey.trim();
    if (!tierKey) {
      tierKey = 'guest';
    }
    const buckets = await this.moodMessagingService.getAvailableBucketsForTier(tierKey as string);
    const hasSecondaryMicro = await this.moodMessagingService.hasSecondaryMicroAccess(tierKey as string);


    return {
      buckets,
      hasSecondaryMicro
    };
  }
}
