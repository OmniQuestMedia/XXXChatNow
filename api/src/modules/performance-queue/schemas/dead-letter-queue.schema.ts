/**
 * Dead Letter Queue Schema
 * 
 * Stores failed queue requests that exceeded max retry attempts for manual review.
 * Implements error handling strategy from PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'dead_letter_queue',
  timestamps: true
})
export class DeadLetterQueue extends Document {
  @Prop({ required: true })
  originalRequestId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  mode: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  originalPayload: any;

  @Prop({ required: true })
  failureReason: string;

  @Prop({ type: Number, required: true })
  attemptCount: number;

  @Prop({ type: [String], required: true })
  errorHistory: string[];

  @Prop({ type: Date, required: true })
  firstAttemptAt: Date;

  @Prop({ type: Date, required: true })
  lastAttemptAt: Date;

  @Prop({ type: Boolean, default: false })
  reviewed: boolean;

  @Prop()
  reviewedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  resolution?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: any;
}

export const DeadLetterQueueSchema = SchemaFactory.createForClass(DeadLetterQueue);

// Create indexes
DeadLetterQueueSchema.index({ originalRequestId: 1 }, { unique: true });
DeadLetterQueueSchema.index({ userId: 1, createdAt: -1 });
DeadLetterQueueSchema.index({ reviewed: 1, createdAt: -1 });
DeadLetterQueueSchema.index({ type: 1, createdAt: -1 });
