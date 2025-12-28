/**
 * Queue Health DTOs
 * 
 * Data Transfer Objects for queue health and monitoring
 */

import { ApiProperty } from '@nestjs/swagger';

export class QueueHealthDto {
  @ApiProperty({ description: 'Overall queue health status' })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({ description: 'Total number of pending requests' })
  pendingCount: number;

  @ApiProperty({ description: 'Number of requests currently being processed' })
  processingCount: number;

  @ApiProperty({ description: 'Number of active workers' })
  activeWorkers: number;

  @ApiProperty({ description: 'Average processing time in milliseconds' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Number of failed requests in last hour' })
  recentFailures: number;

  @ApiProperty({ description: 'Dead letter queue size' })
  dlqSize: number;

  @ApiProperty({ description: 'Queue capacity utilization percentage' })
  capacityUtilization: number;

  @ApiProperty({ description: 'Timestamp of health check' })
  timestamp: Date;
}

export class QueueMetricsDto {
  @ApiProperty({ description: 'Total requests submitted' })
  totalSubmitted: number;

  @ApiProperty({ description: 'Total requests completed' })
  totalCompleted: number;

  @ApiProperty({ description: 'Total requests failed' })
  totalFailed: number;

  @ApiProperty({ description: 'Average wait time in queue (ms)' })
  averageWaitTime: number;

  @ApiProperty({ description: 'Average processing time (ms)' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Throughput (requests per second)' })
  throughput: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Time period for metrics' })
  period: string;
}
