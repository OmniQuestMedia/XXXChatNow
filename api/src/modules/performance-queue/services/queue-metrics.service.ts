/**
 * Queue Metrics Service
 * 
 * Service for tracking and analyzing queue performance metrics.
 * Provides data for monitoring dashboards and alerting.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueRequest, QueueMetrics } from '../schemas';
import { QueueMetricsDto } from '../dtos';
import { REQUEST_STATUS } from '../constants';

@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);

  constructor(
    @InjectModel(QueueRequest.name)
    private queueRequestModel: Model<QueueRequest>,
    @InjectModel(QueueMetrics.name)
    private queueMetricsModel: Model<QueueMetrics>
  ) {}

  /**
   * Get metrics for a specific time range
   */
  async getMetrics(startDate: Date, endDate: Date): Promise<QueueMetricsDto> {
    const requests = await this.queueRequestModel.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    const totalRequests = requests.length;
    const completedRequests = requests.filter(r => r.status === REQUEST_STATUS.COMPLETED).length;
    const failedRequests = requests.filter(r => r.status === REQUEST_STATUS.FAILED).length;

    // Calculate average wait time
    const waitTimes = requests
      .filter(r => r.waitTimeMs !== undefined)
      .map(r => r.waitTimeMs);
    const averageWaitTimeMs = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;

    // Calculate average processing time
    const processingTimes = requests
      .filter(r => r.processingTimeMs !== undefined)
      .map(r => r.processingTimeMs);
    const averageProcessingTimeMs = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    // Calculate throughput per minute
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
    const throughputPerMinute = durationMinutes > 0
      ? completedRequests / durationMinutes
      : 0;

    // Calculate failure rate
    const failureRate = totalRequests > 0
      ? failedRequests / totalRequests
      : 0;

    const timeRange = `${startDate.toISOString()} - ${endDate.toISOString()}`;

    return {
      timeRange,
      totalRequests,
      completedRequests,
      failedRequests,
      averageWaitTimeMs: Math.round(averageWaitTimeMs),
      averageProcessingTimeMs: Math.round(averageProcessingTimeMs),
      throughputPerMinute: Math.round(throughputPerMinute * 100) / 100,
      failureRate: Math.round(failureRate * 10000) / 100 // Percentage with 2 decimals
    };
  }

  /**
   * Get metrics for the last hour
   */
  async getHourlyMetrics(): Promise<QueueMetricsDto> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 3600000); // 1 hour ago
    return this.getMetrics(startDate, endDate);
  }

  /**
   * Get metrics for the last 24 hours
   */
  async getDailyMetrics(): Promise<QueueMetricsDto> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 86400000); // 24 hours ago
    return this.getMetrics(startDate, endDate);
  }

  /**
   * Get detailed metrics breakdown by status
   */
  async getDetailedMetrics(startDate: Date, endDate: Date): Promise<any> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$waitTimeMs' },
          avgProcessingTime: { $avg: '$processingTimeMs' },
          maxWaitTime: { $max: '$waitTimeMs' },
          maxProcessingTime: { $max: '$processingTimeMs' }
        }
      }
    ];

    const results = await this.queueRequestModel.aggregate(pipeline);

    return {
      timeRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      breakdown: results.map(r => ({
        status: r._id,
        count: r.count,
        averageWaitTimeMs: Math.round(r.avgWaitTime || 0),
        averageProcessingTimeMs: Math.round(r.avgProcessingTime || 0),
        maxWaitTimeMs: Math.round(r.maxWaitTime || 0),
        maxProcessingTimeMs: Math.round(r.maxProcessingTime || 0)
      }))
    };
  }

  /**
   * Get metrics by job type
   */
  async getMetricsByType(startDate: Date, endDate: Date): Promise<any> {
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', REQUEST_STATUS.COMPLETED] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', REQUEST_STATUS.FAILED] }, 1, 0] }
          },
          avgProcessingTime: { $avg: '$processingTimeMs' }
        }
      }
    ];

    const results = await this.queueRequestModel.aggregate(pipeline);

    return {
      timeRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      byType: results.map(r => ({
        type: r._id,
        total: r.total,
        completed: r.completed,
        failed: r.failed,
        successRate: r.total > 0 ? Math.round((r.completed / r.total) * 10000) / 100 : 0,
        averageProcessingTimeMs: Math.round(r.avgProcessingTime || 0)
      }))
    };
  }

  /**
   * Archive old metrics (for data retention)
   */
  async archiveOldMetrics(olderThan: Date): Promise<number> {
    // In production, this would export to cold storage
    // For now, we'll just count what would be archived
    const count = await this.queueMetricsModel.countDocuments({
      timestamp: { $lt: olderThan }
    });

    this.logger.log(`Would archive ${count} metric records older than ${olderThan.toISOString()}`);
    
    return count;
  }

  /**
   * Clean up old requests (keeping audit trail for required retention period)
   */
  async cleanupOldRequests(olderThan: Date): Promise<number> {
    // Mark as archived rather than deleting (for audit trail)
    const result = await this.queueRequestModel.updateMany(
      {
        createdAt: { $lt: olderThan },
        status: { $in: [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.FAILED, REQUEST_STATUS.CANCELLED] }
      },
      {
        $set: { 'metadata.archived': true }
      }
    );

    this.logger.log(`Archived ${result.modifiedCount} old requests`);
    
    return result.modifiedCount;
  }
}
