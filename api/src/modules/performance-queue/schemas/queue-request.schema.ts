/**
 * Queue Request Schema
 * 
 * Defines the database schema for queue requests with full audit trail.
 * Ensures data integrity and supports transactional operations.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
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

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ required: true, enum: ['pending', 'assigned', 'processing', 'completed', 'failed', 'timeout', 'cancelled'] })
  status: string;

  @Prop({ required: true, enum: ['fifo', 'priority', 'batch'] })
  mode: string;

  @Prop({ required: true, default: 5, min: 1, max: 20 })
  priority: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  error?: string;

  @Prop({ type: Object })
  result?: any;

  @Prop()
  queuedAt: Date;

  @Prop()
  assignedAt?: Date;

  @Prop()
  processingAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  processingTimeMs?: number;

  @Prop()
  waitTimeMs?: number;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop()
  workerId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const QueueRequestSchema = SchemaFactory.createForClass(QueueRequest);

// Indexes for performance
QueueRequestSchema.index({ requestId: 1 }, { unique: true });
QueueRequestSchema.index({ userId: 1 });
QueueRequestSchema.index({ status: 1, priority: -1, queuedAt: 1 });
QueueRequestSchema.index({ idempotencyKey: 1 });
QueueRequestSchema.index({ createdAt: 1 });
QueueRequestSchema.index({ type: 1, status: 1 });
