/**
 * Queue Item Schema
 * 
 * MongoDB schema for performance queue items.
 * Stores all queue items with complete audit trail and state management.
 * 
 * Security Requirements:
 * - No PII logged (user_id and performer_id are references only)
 * - Complete audit trail for all state transitions
 * - Idempotency key enforcement with unique constraint
 * - All timestamps for lifecycle tracking
 * 
 * References:
 * - XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { QueueItemStatus } from '../constants';

@Schema({
  collection: 'performance_queue_items',
  timestamps: true
})
export class QueueItem {
  /**
   * Unique idempotency key to prevent duplicate processing
   * This is the primary deduplication mechanism
   */
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  idempotencyKey: string;

  /**
   * Source feature that created this queue item
   * Examples: 'chip_menu', 'slot_machine', 'wheel', 'tip_menu'
   */
  @Prop({
    type: String,
    required: true,
    index: true
  })
  sourceFeature: string;

  /**
   * Source event/transaction ID from originating feature
   * Used for traceability back to the original transaction
   */
  @Prop({
    type: String,
    required: true,
    index: true
  })
  sourceEventId: string;

  /**
   * Performer/model who will process this item
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Performer'
  })
  performerId: ObjectId;

  /**
   * User who initiated this queue item
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'User'
  })
  userId: ObjectId;

  /**
   * Escrow transaction ID holding the funds
   * Queue service will release or refund based on lifecycle
   */
  @Prop({
    type: String,
    required: true,
    index: true
  })
  escrowTransactionId: string;

  /**
   * Token/points amount for this item
   */
  @Prop({
    type: Number,
    required: true,
    min: 0
  })
  tokens: number;

  /**
   * Title of the queue item
   */
  @Prop({
    type: String,
    required: true
  })
  title: string;

  /**
   * Description of what performer should do
   */
  @Prop({
    type: String,
    required: true
  })
  description: string;

  /**
   * Expected duration in seconds (null if not applicable)
   */
  @Prop({
    type: Number,
    default: null
  })
  durationSeconds: number | null;

  /**
   * Additional metadata (non-PII, feature-specific data)
   */
  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {}
  })
  metadata: Record<string, any>;

  /**
   * Current status of the queue item
   * Lifecycle: created -> started -> finished/abandoned/refunded
   */
  @Prop({
    type: String,
    enum: Object.values(QueueItemStatus),
    default: QueueItemStatus.CREATED,
    required: true,
    index: true
  })
  status: QueueItemStatus;

  /**
   * Position in the performer's queue
   * 1 = first in queue, recalculated on state changes
   */
  @Prop({
    type: Number,
    required: true,
    index: true
  })
  position: number;

  /**
   * Timestamp when item was created (added to queue)
   */
  @Prop({
    type: Date,
    default: Date.now,
    index: true
  })
  createdAt: Date;

  /**
   * Timestamp when item was last updated
   */
  @Prop({
    type: Date,
    default: Date.now
  })
  updatedAt: Date;

  /**
   * Timestamp when performer started processing
   * Null if not yet started
   */
  @Prop({
    type: Date,
    default: null
  })
  startedAt: Date | null;

  /**
   * Timestamp when item was finished/completed
   * Null if not yet finished
   */
  @Prop({
    type: Date,
    default: null
  })
  finishedAt: Date | null;

  /**
   * Timestamp when item was abandoned
   * Null if not abandoned
   */
  @Prop({
    type: Date,
    default: null
  })
  abandonedAt: Date | null;

  /**
   * Timestamp when item was refunded
   * Null if not refunded
   */
  @Prop({
    type: Date,
    default: null
  })
  refundedAt: Date | null;

  /**
   * Refund reason (if refunded)
   */
  @Prop({
    type: String,
    default: null
  })
  refundReason: string | null;

  /**
   * Whether settlement has been completed
   * True when escrow has been released to performer's earned wallet
   */
  @Prop({
    type: Boolean,
    default: false
  })
  settled: boolean;

  /**
   * Timestamp when settlement occurred
   */
  @Prop({
    type: Date,
    default: null
  })
  settledAt: Date | null;

  /**
   * Settlement transaction ID (if settled)
   */
  @Prop({
    type: String,
    default: null
  })
  settlementTransactionId: string | null;

  /**
   * Whether item was processed in pass-through mode (queue OFF)
   * Used for analytics and debugging
   */
  @Prop({
    type: Boolean,
    default: false
  })
  passThroughMode: boolean;
}

export type QueueItemDocument = HydratedDocument<QueueItem>;

export const QueueItemSchema = SchemaFactory.createForClass(QueueItem);

/**
 * Compound indexes for efficient querying
 */

// Query items by performer and status (most common query)
QueueItemSchema.index({ performerId: 1, status: 1, position: 1 });

// Query items by user for history
QueueItemSchema.index({ userId: 1, createdAt: -1 });

// Query by performer and creation time for queue ordering
QueueItemSchema.index({ performerId: 1, createdAt: 1 });

// Query by escrow transaction for settlement/refund operations
QueueItemSchema.index({ escrowTransactionId: 1 });

// Query by source feature and event for traceability
QueueItemSchema.index({ sourceFeature: 1, sourceEventId: 1 });

// Query unsettled items for cleanup jobs
QueueItemSchema.index({ settled: 1, status: 1, createdAt: -1 });
