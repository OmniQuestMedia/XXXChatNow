/**
 * Queue Request DTOs
 * 
 * Data Transfer Objects for queue request operations.
 * Ensures type safety and validation for API requests.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { IsString, IsNotEmpty, IsObject, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { QUEUE_MODE, PRIORITY_LEVEL } from '../constants';

export class CreateQueueRequestDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @IsEnum([QUEUE_MODE.FIFO, QUEUE_MODE.PRIORITY, QUEUE_MODE.BATCH])
  @IsOptional()
  mode?: string = QUEUE_MODE.FIFO;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  priority?: number = PRIORITY_LEVEL.NORMAL;

  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueueRequestResponseDto {
  requestId: string;
  status: string;
  message?: string;
  estimatedWaitTimeMs?: number;
  queuePosition?: number;
}

export class GetQueueStatusDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;
}

export class CancelQueueRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;
}

export class QueueHealthDto {
  healthy: boolean;
  queueDepth: number;
  activeWorkers: number;
  averageWaitTimeMs: number;
  averageProcessingTimeMs: number;
  failureRate: number;
  timestamp: Date;
}

export class QueueMetricsDto {
  timeRange: string;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageWaitTimeMs: number;
  averageProcessingTimeMs: number;
  throughputPerMinute: number;
  failureRate: number;
}

export class DetailedMetricsDto {
  timeRange: string;
  breakdown: MetricsBreakdownDto[];
}

export class MetricsBreakdownDto {
  status: string;
  count: number;
  averageWaitTimeMs: number;
  averageProcessingTimeMs: number;
  maxWaitTimeMs: number;
  maxProcessingTimeMs: number;
}

export class MetricsByTypeDto {
  timeRange: string;
  byType: TypeMetricsDto[];
}

export class TypeMetricsDto {
  type: string;
  total: number;
  completed: number;
  failed: number;
  successRate: number;
  averageProcessingTimeMs: number;
}

