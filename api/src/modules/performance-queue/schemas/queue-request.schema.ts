/**
 * Queue Request Schema
 * 
 * Stores queue requests with metadata for tracking and processing.
 * Implements the performance queue architecture specified in PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'queue_requests',
  timestamps: true
})
export class QueueRequest extends Document {
  @Prop({ required: true })
  requestId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['fifo', 'priority', 'batch'] })
  mode: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: any;

  @Prop({ required: true, enum: ['pending', 'assigned', 'processing', 'completed', 'failed', 'timeout', 'cancelled'] })
  status: string;

  @Prop({ type: Number, default: 5 })
  priority: number;

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop()
  workerId?: string;

  @Prop()
  assignedAt?: Date;

  @Prop()
  processingStartedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  error?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  result?: any;

  @Prop()
  idempotencyKey?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: any;

  createdAt?: Date;
  updatedAt?: Date;
}

export const QueueRequestSchema = SchemaFactory.createForClass(QueueRequest);

// Create indexes for efficient queries
QueueRequestSchema.index({ requestId: 1 }, { unique: true });
QueueRequestSchema.index({ userId: 1, createdAt: -1 });
QueueRequestSchema.index({ status: 1, priority: -1, createdAt: 1 });
QueueRequestSchema.index({ mode: 1, status: 1 });
QueueRequestSchema.index({ idempotencyKey: 1 }, { sparse: true, unique: true });
QueueRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24 hours
