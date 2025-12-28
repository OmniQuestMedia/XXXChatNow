/**
 * Queue Metrics Schema
 * 
 * Tracks queue performance metrics for monitoring and analytics.
 * Provides data for throughput, latency, and failure analysis.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'queue_metrics',
  timestamps: true
})
export class QueueMetrics extends Document {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  queueType: string;

  @Prop({ required: true, default: 0 })
  requestsQueued: number;

  @Prop({ required: true, default: 0 })
  requestsCompleted: number;

  @Prop({ required: true, default: 0 })
  requestsFailed: number;

  @Prop({ required: true, default: 0 })
  requestsRetried: number;

  @Prop({ required: true, default: 0 })
  requestsTimeout: number;

  @Prop({ required: true, default: 0 })
  averageWaitTimeMs: number;

  @Prop({ required: true, default: 0 })
  averageProcessingTimeMs: number;

  @Prop({ required: true, default: 0 })
  maxWaitTimeMs: number;

  @Prop({ required: true, default: 0 })
  maxProcessingTimeMs: number;

  @Prop({ required: true, default: 0 })
  currentQueueDepth: number;

  @Prop({ required: true, default: 0 })
  activeWorkers: number;
}

export const QueueMetricsSchema = SchemaFactory.createForClass(QueueMetrics);

// Indexes
QueueMetricsSchema.index({ timestamp: -1 });
QueueMetricsSchema.index({ queueType: 1, timestamp: -1 });
