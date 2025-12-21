/**
 * SM-Payout-Transaction Schema
 * 
 * Immutable record of all token debits/credits for slot machine operations.
 * Each prize fulfillment = ONE immutable transaction.
 * 
 * Key Features:
 * - Immutable once created (no updates allowed)
 * - Complete audit trail per transaction
 * - Idempotent operations
 * - Integration with Ledger API
 * 
 * Security:
 * - Server-side only
 * - No PII logged
 * - Integrity hashes for tamper detection
 * - 8-year retention policy
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ObjectId } from 'mongodb';

export type SMPayoutTransactionDocument = HydratedDocument<SMPayoutTransaction>;

export enum TransactionType {
  DEBIT = 'debit',     // User pays to enter queue/spin
  CREDIT = 'credit',   // User wins payout
  REFUND = 'refund'    // Entry fee refunded
}

export enum TransactionStatus {
  PENDING = 'pending',       // Transaction initiated
  PROCESSING = 'processing', // Being processed by Ledger API
  COMPLETED = 'completed',   // Successfully completed
  FAILED = 'failed',         // Transaction failed
  REVERSED = 'reversed'      // Transaction reversed/refunded
}

@Schema({
  collection: 'sm_payout_transactions',
  timestamps: true
})
export class SMPayoutTransaction {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  transactionId: string; // Format: txn_{timestamp}_{uuid}

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  idempotencyKey: string;

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
    enum: Object.values(TransactionType),
    required: true,
    index: true
  })
  type: TransactionType;

  @Prop({
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING,
    index: true
  })
  status: TransactionStatus;

  @Prop({
    type: Number,
    required: true
  })
  amount: number; // Token amount (always positive)

  @Prop({
    type: Number,
    default: null
  })
  balanceBefore: number;

  @Prop({
    type: Number,
    default: null
  })
  balanceAfter: number;

  @Prop({
    type: String,
    default: null
  })
  gameSessionId: string; // Reference to SM-Game-Session

  @Prop({
    type: String,
    default: null
  })
  queueId: string; // Reference to SM-Queue-Entry

  @Prop({
    type: String,
    default: null
  })
  spinId: string; // Reference to specific spin if applicable

  @Prop({
    type: String,
    default: null
  })
  ledgerTransactionId: string; // Reference to Ledger API transaction

  @Prop({
    type: String,
    default: null
  })
  reversalTransactionId: string; // Reference to reversal transaction if applicable

  @Prop({
    type: Object,
    default: null
  })
  prizeData: {
    symbols?: string[];
    multiplier?: number;
    payout?: number;
    isWin?: boolean;
  };

  @Prop({
    type: Object,
    default: null
  })
  ledgerResponse: {
    success: boolean;
    responseCode?: string;
    message?: string;
    timestamp?: Date;
  };

  @Prop({
    type: Date,
    required: true,
    default: Date.now
  })
  initiatedAt: Date;

  @Prop({
    type: Date,
    default: null
  })
  processedAt: Date;

  @Prop({
    type: Date,
    default: null
  })
  completedAt: Date;

  @Prop({
    type: Number,
    default: null
  })
  durationMs: number; // Processing duration in milliseconds

  @Prop({
    type: String,
    default: null
  })
  integrityHash: string; // SHA-256 hash for tamper detection

  @Prop({
    type: Object,
    default: null
  })
  metadata: {
    reason: string;           // e.g., 'slot_machine_spin', 'queue_entry', 'overflow_refund'
    abandonmentNote?: string; // Why transaction was abandoned/refunded
    errorDetails?: string;    // Error details if failed
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

export const SMPayoutTransactionSchema = SchemaFactory.createForClass(SMPayoutTransaction);

// Compound indexes for efficient queries
SMPayoutTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 }); // User transaction history
SMPayoutTransactionSchema.index({ performerId: 1, type: 1, createdAt: -1 }); // Model transaction history
SMPayoutTransactionSchema.index({ status: 1, initiatedAt: 1 }); // Find pending transactions
SMPayoutTransactionSchema.index({ gameSessionId: 1 }); // Transactions by session
SMPayoutTransactionSchema.index({ createdAt: 1, archived: 1 }); // Archival queries
SMPayoutTransactionSchema.index({ ledgerTransactionId: 1 }); // Ledger reconciliation
