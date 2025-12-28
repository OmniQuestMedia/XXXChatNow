/**
 * Queue Health Service
 * 
 * Provides health monitoring and metrics for the queue system.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueRequest, DeadLetterQueue } from '../schemas';
import { QueueHealthDto, QueueMetricsDto } from '../dtos';
import { REQUEST_STATUS, MAX_QUEUE_DEPTH } from '../constants';

@Injectable()
export class QueueHealthService {
  constructor(
    @InjectModel(QueueRequest.name) private queueRequestModel: Model<QueueRequest>,
    @InjectModel(DeadLetterQueue.name) private deadLetterQueueModel: Model<DeadLetterQueue>
  ) {}

  /**
   * Get current health status of the queue system
   */
  async getHealthStatus(): Promise<QueueHealthDto> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get queue counts
    const [pendingCount, processingCount, dlqSize, recentFailures] = await Promise.all([
      this.queueRequestModel.countDocuments({ status: REQUEST_STATUS.PENDING }),
      this.queueRequestModel.countDocuments({ status: REQUEST_STATUS.PROCESSING }),
      this.deadLetterQueueModel.countDocuments({ reviewed: false }),
      this.queueRequestModel.countDocuments({
        status: REQUEST_STATUS.FAILED,
        failedAt: { $gte: oneHourAgo }
      })
    ]);

    // Calculate average processing time for completed requests in last hour
    const recentCompleted = await this.queueRequestModel.find({
      status: REQUEST_STATUS.COMPLETED,
      completedAt: { $gte: oneHourAgo },
      processingStartedAt: { $exists: true }
    }).select('processingStartedAt completedAt');

    let averageProcessingTime = 0;
    if (recentCompleted.length > 0) {
      const totalProcessingTime = recentCompleted.reduce((sum, req) => {
        const processingTime = req.completedAt.getTime() - req.processingStartedAt.getTime();
        return sum + processingTime;
      }, 0);
      averageProcessingTime = Math.round(totalProcessingTime / recentCompleted.length);
    }

    // Get unique worker count (approximate based on recent processing)
    const activeWorkers = await this.queueRequestModel.distinct('workerId', {
      status: REQUEST_STATUS.PROCESSING
    });

    // Calculate capacity utilization
    const capacityUtilization = MAX_QUEUE_DEPTH > 0 
      ? Math.min(100, Math.round((pendingCount / MAX_QUEUE_DEPTH) * 100))
      : 0;

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (capacityUtilization > 90 || recentFailures > 100 || dlqSize > 50) {
      status = 'unhealthy';
    } else if (capacityUtilization > 70 || recentFailures > 50 || dlqSize > 20) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      pendingCount,
      processingCount,
      activeWorkers: activeWorkers.length,
      averageProcessingTime,
      recentFailures,
      dlqSize,
      capacityUtilization,
      timestamp: now
    };
  }

  /**
   * Get detailed metrics for a time period
   */
  async getMetrics(periodMinutes = 60): Promise<QueueMetricsDto> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodMinutes * 60 * 1000);

    const [submitted, completed, failed] = await Promise.all([
      this.queueRequestModel.countDocuments({
        createdAt: { $gte: periodStart }
      }),
      this.queueRequestModel.countDocuments({
        status: REQUEST_STATUS.COMPLETED,
        completedAt: { $gte: periodStart }
      }),
      this.queueRequestModel.countDocuments({
        status: REQUEST_STATUS.FAILED,
        failedAt: { $gte: periodStart }
      })
    ]);

    // Calculate average wait time (time from creation to processing start)
    const processedRequests = await this.queueRequestModel.find({
      processingStartedAt: { $gte: periodStart, $exists: true }
    }).select('createdAt processingStartedAt completedAt');

    let averageWaitTime = 0;
    let averageProcessingTime = 0;

    if (processedRequests.length > 0) {
      const totalWaitTime = processedRequests.reduce((sum, req) => {
        const waitTime = req.processingStartedAt.getTime() - req.createdAt.getTime();
        return sum + waitTime;
      }, 0);
      averageWaitTime = Math.round(totalWaitTime / processedRequests.length);

      const completedWithTimes = processedRequests.filter(req => req.completedAt);
      if (completedWithTimes.length > 0) {
        const totalProcessingTime = completedWithTimes.reduce((sum, req) => {
          const processingTime = req.completedAt.getTime() - req.processingStartedAt.getTime();
          return sum + processingTime;
        }, 0);
        averageProcessingTime = Math.round(totalProcessingTime / completedWithTimes.length);
      }
    }

    // Calculate throughput (requests per second)
    const periodSeconds = periodMinutes * 60;
    const throughput = completed / periodSeconds;

    // Calculate success rate
    const total = completed + failed;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    return {
      totalSubmitted: submitted,
      totalCompleted: completed,
      totalFailed: failed,
      averageWaitTime,
      averageProcessingTime,
      throughput: Math.round(throughput * 100) / 100, // Round to 2 decimal places
      successRate,
      period: `${periodMinutes} minutes`
    };
  }

  /**
   * Get dead letter queue entries for review
   */
  async getDeadLetterQueueEntries(limit = 50) {
    return this.deadLetterQueueModel
      .find({ reviewed: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Mark a DLQ entry as reviewed
   */
  async markDLQAsReviewed(
    dlqId: string,
    reviewedBy: string,
    resolution: string
  ): Promise<void> {
    await this.deadLetterQueueModel.updateOne(
      { _id: dlqId },
      {
        reviewed: true,
        reviewedBy,
        reviewedAt: new Date(),
        resolution
      }
    );
  }
}
