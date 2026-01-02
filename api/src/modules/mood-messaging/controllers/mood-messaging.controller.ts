import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
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
    const tierKey = query.tierKey || 'guest';
    const username = query.username || user.username || 'there';

    const message = await this.moodMessagingService.getPrivateMoodMessage(
      user._id,
      tierKey,
      username
    );

    return {
      message
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
    @Query('tierKey') tierKey = 'guest'
  ): Promise<AvailableBucketsResponseDto> {
    const buckets = await this.moodMessagingService.getAvailableBucketsForTier(tierKey);
    const hasSecondaryMicro = await this.moodMessagingService.hasSecondaryMicroAccess(tierKey);

    return {
      buckets,
      hasSecondaryMicro
    };
  }
}
