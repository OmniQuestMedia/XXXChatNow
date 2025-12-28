/**
 * Performance Queue Controller
 * 
 * REST API endpoints for queue operations and monitoring.
 * All endpoints require authentication.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - COPILOT_GOVERNANCE.md
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { RoleGuard } from 'src/modules/auth/guards';
import { PerformanceQueueService } from '../services/performance-queue.service';
import { QueueHealthService } from '../services/queue-health.service';
import {
  SubmitQueueRequestDto,
  QueueRequestResponseDto,
  QueueRequestStatusDto,
  QueueHealthDto,
  QueueMetricsDto
} from '../dtos';
import { MAX_METRICS_PERIOD_MINUTES, MAX_DLQ_LIMIT, DEFAULT_DLQ_LIMIT } from '../constants';

@ApiTags('Performance Queue')
@Controller('performance-queue')
@UseGuards(RoleGuard)
@ApiBearerAuth()
export class PerformanceQueueController {
  constructor(
    private readonly queueService: PerformanceQueueService,
    private readonly healthService: QueueHealthService
  ) {}

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new request to the queue' })
  @ApiResponse({ status: 201, description: 'Request submitted successfully', type: QueueRequestResponseDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({ status: 503, description: 'Queue is full' })
  async submitRequest(
    @CurrentUser() user: any,
    @Body() dto: SubmitQueueRequestDto
  ): Promise<QueueRequestResponseDto> {
    return this.queueService.submitRequest(user._id, dto);
  }

  @Get('status/:requestId')
  @ApiOperation({ summary: 'Get status of a queue request' })
  @ApiResponse({ status: 200, description: 'Request status retrieved', type: QueueRequestStatusDto })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async getRequestStatus(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string
  ): Promise<QueueRequestStatusDto> {
    return this.queueService.getRequestStatus(requestId, user._id);
  }

  @Delete('cancel/:requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a pending queue request' })
  @ApiResponse({ status: 204, description: 'Request cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel request in current status' })
  async cancelRequest(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string
  ): Promise<void> {
    return this.queueService.cancelRequest(requestId, user._id);
  }

  @Get('health')
  @Roles('admin')
  @ApiOperation({ summary: 'Get queue health status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Health status retrieved', type: QueueHealthDto })
  async getHealth(): Promise<QueueHealthDto> {
    return this.healthService.getHealthStatus();
  }

  @Get('metrics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get queue metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved', type: QueueMetricsDto })
  async getMetrics(
    @Query('period') period?: number
  ): Promise<QueueMetricsDto> {
    const periodMinutes = period && period > 0 && period <= MAX_METRICS_PERIOD_MINUTES ? period : 60;
    return this.healthService.getMetrics(periodMinutes);
  }

  @Get('dlq')
  @Roles('admin')
  @ApiOperation({ summary: 'Get dead letter queue entries (Admin only)' })
  @ApiResponse({ status: 200, description: 'DLQ entries retrieved' })
  async getDeadLetterQueue(
    @Query('limit') limit?: number
  ) {
    const maxLimit = limit && limit > 0 && limit <= MAX_DLQ_LIMIT ? limit : DEFAULT_DLQ_LIMIT;
    return this.healthService.getDeadLetterQueueEntries(maxLimit);
  }

  @Post('dlq/:dlqId/review')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark DLQ entry as reviewed (Admin only)' })
  @ApiResponse({ status: 204, description: 'DLQ entry marked as reviewed' })
  async markDLQReviewed(
    @CurrentUser() user: any,
    @Param('dlqId') dlqId: string,
    @Body('resolution') resolution: string
  ): Promise<void> {
    return this.healthService.markDLQAsReviewed(dlqId, user._id.toString(), resolution);
  }
}
