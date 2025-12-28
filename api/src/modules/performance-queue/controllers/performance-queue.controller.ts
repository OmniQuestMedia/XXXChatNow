/**
 * Performance Queue Controller
 * 
 * API endpoints for queue operations with authentication and authorization.
 * 
 * Security:
 * - All endpoints require authentication
 * - Users can only access their own requests
 * - Admin endpoints require elevated permissions
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
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { CurrentUser } from 'src/modules/auth/decorators';
import { PriorityQueueService, QueueMetricsService } from '../services';
import {
  CreateQueueRequestDto,
  QueueRequestResponseDto,
  QueueHealthDto,
  QueueMetricsDto
} from '../dtos';

@Controller('performance-queue')
export class PerformanceQueueController {
  constructor(
    private readonly priorityQueueService: PriorityQueueService,
    private readonly queueMetricsService: QueueMetricsService
  ) {}

  /**
   * Submit a new request to the queue
   * 
   * Security: Requires authentication, enforces rate limiting
   */
  @Post('submit')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async submitRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateQueueRequestDto
  ): Promise<QueueRequestResponseDto> {
    return this.priorityQueueService.submitRequest(user._id, dto);
  }

  /**
   * Get status of a specific request
   * 
   * Security: Users can only view their own requests
   */
  @Get('request/:requestId')
  @UseGuards(AuthGuard)
  async getRequestStatus(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string
  ) {
    return this.priorityQueueService.getRequestStatus(requestId, user._id);
  }

  /**
   * Cancel a pending request
   * 
   * Security: Users can only cancel their own requests
   */
  @Delete('request/:requestId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelRequest(
    @CurrentUser() user: any,
    @Param('requestId') requestId: string
  ): Promise<void> {
    return this.priorityQueueService.cancelRequest(requestId, user._id);
  }

  /**
   * Get queue health status
   * 
   * Security: Public endpoint for monitoring (no sensitive data)
   */
  @Get('health')
  async getHealth(): Promise<QueueHealthDto> {
    return this.priorityQueueService.getHealth();
  }

  /**
   * Get hourly metrics
   * 
   * Security: Requires authentication
   */
  @Get('metrics/hourly')
  @UseGuards(AuthGuard)
  async getHourlyMetrics(): Promise<QueueMetricsDto> {
    return this.queueMetricsService.getHourlyMetrics();
  }

  /**
   * Get daily metrics
   * 
   * Security: Requires authentication
   */
  @Get('metrics/daily')
  @UseGuards(AuthGuard)
  async getDailyMetrics(): Promise<QueueMetricsDto> {
    return this.queueMetricsService.getDailyMetrics();
  }

  /**
   * Get detailed metrics for a custom date range
   * 
   * Security: Requires authentication
   */
  @Get('metrics/detailed')
  @UseGuards(AuthGuard)
  async getDetailedMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.queueMetricsService.getDetailedMetrics(start, end);
  }

  /**
   * Get metrics by job type
   * 
   * Security: Requires authentication
   */
  @Get('metrics/by-type')
  @UseGuards(AuthGuard)
  async getMetricsByType(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.queueMetricsService.getMetricsByType(start, end);
  }
}
