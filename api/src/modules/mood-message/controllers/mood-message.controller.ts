/**
 * Mood Message Controller
 * 
 * REST API endpoints for mood-based message delivery and tracking.
 * All endpoints require authentication.
 * 
 * Reference: MODEL_MOOD_RESPONSE_SYSTEM.md
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { MoodMessageService } from '../services';
import { SendMoodMessageDto } from '../dtos';

/**
 * Controller for mood message operations
 */
@ApiTags('Mood Messages')
@Controller('mood-message')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MoodMessageController {
  constructor(
    private readonly moodMessageService: MoodMessageService
  ) {}

  /**
   * Send a mood-based message
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a mood-based message to a user' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipient not found' })
  async sendMessage(
    @Body() dto: SendMoodMessageDto,
    @CurrentUser() user: any
  ) {
    return this.moodMessageService.sendMessage(user._id, dto);
  }

  /**
   * Get message delivery status
   */
  @Get(':messageId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get message delivery status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async getMessageStatus(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any
  ) {
    return this.moodMessageService.getMessageStatus(messageId, user._id);
  }

  /**
   * Get message history
   */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get message history for authenticated user' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMessageHistory(
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
    @Query('message_type') messageType?: string,
    @Query('mood') mood?: string,
    @CurrentUser() user: any
  ) {
    return this.moodMessageService.getMessageHistory(
      user._id,
      parseInt(limit, 10),
      parseInt(offset, 10),
      messageType,
      mood
    );
  }

  /**
   * Mark message as read
   */
  @Patch(':messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markAsRead(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any
  ) {
    await this.moodMessageService.markAsRead(messageId, user._id);
    return { success: true, message: 'Message marked as read' };
  }

  /**
   * Get analytics (admin only - would need role guard in production)
   */
  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get mood message analytics (admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.moodMessageService.getAnalytics(start, end);
  }
}
