/**
 * SM-Queue-Entry Schema
 * 
 * Tracks users waiting in queue to play slot machine with a specific model.
 * 
 * Key Features:
 * - One queue per model (performerId)
 * - Position tracking for FIFO ordering
 * - Entry fee held in escrow until game starts or user abandons
 * - Automatic refund on overflow or timeout
 * 
 * Security:
 * - Immutable once created (status changes only)
 * - Idempotency key prevents duplicate entries
 * - Complete audit trail
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ObjectId } from 'mongodb';

export type SMQueueEntryDocument = HydratedDocument<SMQueueEntry>;

export enum QueueEntryStatus {
  WAITING = 'waiting',           // User is waiting in queue
  ACTIVE = 'active',             // User is currently playing
  COMPLETED = 'completed',       // Game completed successfully
  ABANDONED = 'abandoned',       // User left queue or timed out
  REFUNDED = 'refunded',         // Entry fee refunded due to overflow/timeout
  EXPIRED = 'expired'            // Queue entry expired
}

@Schema({
  collection: 'sm_queue_entries',
  timestamps: true
})
export class SMQueueEntry {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  userId: ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  performerId: ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  queueId: string; // Format: queue_{timestamp}_{uuid}

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  idempotencyKey: string;

  @Prop({
    type: Number,
    required: true
  })
  position: number; // Position in queue (0-based)

  @Prop({
    type: Number,
    required: true
  })
  entryFee: number; // Tokens held in escrow

  @Prop({
    type: String,
    enum: Object.values(QueueEntryStatus),
    default: QueueEntryStatus.WAITING,
    index: true
  })
  status: QueueEntryStatus;

  @Prop({
    type: Date,
    required: true,
    default: Date.now
  })
  joinedAt: Date;

  @Prop({
    type: Date,
    default: null
  })
  startedAt: Date; // When game actually started

  @Prop({
    type: Date,
    default: null
  })
  completedAt: Date; // When game finished

  @Prop({
    type: Date,
    default: null
  })
  expiresAt: Date; // Queue entry expiration (configurable timeout)

  @Prop({
    type: String,
    default: null
  })
  gameSessionId: string; // Reference to SM-Game-Session when active

  @Prop({
    type: String,
    default: null
  })
  ledgerTransactionId: string; // Reference to Ledger API transaction

  @Prop({
    type: String,
    default: null
  })
  refundTransactionId: string; // Reference to refund transaction if abandoned

  @Prop({
    type: Object,
    default: null
  })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    abandonmentReason?: string; // Why user left queue (overflow, timeout, manual)
  };

  @Prop({
    type: Boolean,
    default: false
  })
  archived: boolean; // For 8-year retention policy

  // Timestamps (createdAt, updatedAt) added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const SMQueueEntrySchema = SchemaFactory.createForClass(SMQueueEntry);

// Compound indexes for efficient queries
SMQueueEntrySchema.index({ performerId: 1, status: 1, position: 1 }); // Get queue by model
SMQueueEntrySchema.index({ userId: 1, status: 1, createdAt: -1 }); // Get user's queue history
SMQueueEntrySchema.index({ status: 1, expiresAt: 1 }); // Find expired entries
SMQueueEntrySchema.index({ createdAt: 1, archived: 1 }); // Archival queries
