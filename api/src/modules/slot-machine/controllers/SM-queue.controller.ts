/**
 * SM-Queue Controller
 * 
 * Queue management endpoints for slot machine feature.
 * 
 * Key Features:
 * - Join/leave queue for model-based games
 * - Check queue status and position
 * - View user's queue history
 * 
 * Security:
 * - Authentication required
 * - User can only manage their own queue entries
 * - Rate limiting applied
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/auth/guards';
import { SMQueueService } from '../services/SM-queue.service';
import {
  JoinQueuePayload,
  LeaveQueuePayload,
  GetQueueStatusPayload
} from '../payloads/SM-queue.payload';
import {
  SMQueueEntryDto,
  SMQueueStatusDto,
  SMGameSessionDto
} from '../dtos/SM-queue.dto';

@ApiTags('Slot Machine Queue')
@Controller('slot-machine/queue')
export class SMQueueController {
  constructor(
    private readonly queueService: SMQueueService
  ) {}

  /**
   * Join queue for a model
   */
  @Post('join')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Join queue to play with a model' })
  @ApiResponse({
    status: 201,
    description: 'Successfully joined queue',
    type: SMQueueEntryDto
  })
  @ApiResponse({
    status: 400,
    description: 'Already in queue or invalid request'
  })
  @ApiResponse({
    status: 503,
    description: 'Queue is full or Ledger is unavailable'
  })
  async joinQueue(
    @Request() req: any,
    @Body() payload: JoinQueuePayload
  ): Promise<SMQueueEntryDto> {
    const userId = req.user._id;
    
    const queueEntry = await this.queueService.joinQueue({
      userId,
      performerId: payload.performerId,
      entryFee: payload.entryFee,
      idempotencyKey: payload.idempotencyKey,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: req.session?.id
      }
    });

    return {
      queueId: queueEntry.queueId,
      userId: queueEntry.userId.toString(),
      performerId: queueEntry.performerId.toString(),
      position: queueEntry.position,
      entryFee: queueEntry.entryFee,
      status: queueEntry.status,
      joinedAt: queueEntry.joinedAt,
      expiresAt: queueEntry.expiresAt
    };
  }

  /**
   * Leave queue (abandon)
   */
  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Leave queue and get refund' })
  @ApiResponse({
    status: 204,
    description: 'Successfully left queue'
  })
  @ApiResponse({
    status: 400,
    description: 'Not in queue'
  })
  async leaveQueue(
    @Request() req: any,
    @Body() payload: LeaveQueuePayload
  ): Promise<void> {
    const userId = req.user._id;
    
    await this.queueService.leaveQueue(
      userId,
      payload.performerId,
      payload.reason || 'user_left'
    );
  }

  /**
   * Get queue status for a model
   */
  @Get('status')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get queue status for a model' })
  @ApiResponse({
    status: 200,
    description: 'Queue status retrieved',
    type: SMQueueStatusDto
  })
  async getQueueStatus(
    @Request() req: any,
    @Query() query: GetQueueStatusPayload
  ): Promise<SMQueueStatusDto> {
    const userId = req.user._id;
    
    const status = await this.queueService.getQueueStatus(
      query.performerId,
      userId
    );

    return {
      performerId: status.performerId.toString(),
      queueLength: status.queueLength,
      hasActiveSession: status.activeSession !== null,
      userPosition: status.userPosition,
      estimatedWaitTimeMs: status.estimatedWaitTimeMs,
      canJoin: status.canJoin,
      reason: status.reason
    };
  }

  /**
   * Get user's current queue entry (if any)
   */
  @Get('my-entry')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current queue entry for user' })
  @ApiResponse({
    status: 200,
    description: 'Queue entry retrieved (or null if not in queue)',
    type: SMQueueEntryDto
  })
  async getMyQueueEntry(
    @Request() req: any,
    @Query('performerId') performerId: string
  ): Promise<SMQueueEntryDto | null> {
    const userId = req.user._id;
    
    const status = await this.queueService.getQueueStatus(performerId, userId);
    
    if (status.userPosition === null) {
      return null;
    }

    // Return basic info (full entry is in queue status)
    return {
      queueId: 'N/A', // Would need to fetch from database
      userId: userId.toString(),
      performerId: performerId,
      position: status.userPosition,
      entryFee: 0, // Would need to fetch from database
      status: 'waiting',
      joinedAt: new Date(),
      expiresAt: new Date(),
      estimatedWaitTimeMs: status.estimatedWaitTimeMs
    };
  }
}
