/**
 * Slot Machine Transaction Schema
 * 
 * This schema stores immutable, auditable transaction records for all slot machine spins.
 * 
 * Security Requirements (SECURITY_AUDIT_POLICY_AND_CHECKLIST.md):
 * - No PII logged (user_id is reference only)
 * - No payment details stored
 * - Complete audit trail maintained
 * - Idempotency key enforcement
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (Data Models section)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (Section 6 - Retention Policy)
 */

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'slot_machine_transactions',
  timestamps: true
})
export class SlotMachineTransaction {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  spinId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'User'
  })
  userId: ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  idempotencyKey: string;

  @Prop({
    type: Number,
    required: true,
    min: 0
  })
  betAmount: number;

  @Prop({
    type: [String],
    required: true
  })
  resultSymbols: string[];

  @Prop({
    type: Boolean,
    required: true,
    default: false
  })
  isWin: boolean;

  @Prop({
    type: Number,
    required: true,
    default: 0,
    min: 0
  })
  payout: number;

  @Prop({
    type: Number,
    default: 0
  })
  multiplier: number;

  @Prop({
    type: Number,
    required: true,
    min: 0
  })
  balanceBefore: number;

  @Prop({
    type: Number,
    required: true,
    min: 0
  })
  balanceAfter: number;

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  })
  status: string;

  @Prop({
    type: String
  })
  loyaltyTransactionId: string;

  // Non-PII metadata for security analysis
  @Prop({
    type: String
  })
  ipAddress: string;

  @Prop({
    type: String
  })
  userAgent: string;

  @Prop({
    type: String
  })
  sessionId: string;

  // Configuration version used for this spin
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'SlotMachineConfig'
  })
  configId: ObjectId;

  // Server-side timestamp for audit purposes
  @Prop({
    type: Date,
    default: Date.now,
    index: true
  })
  serverTimestamp: Date;

  // Cryptographic hash for integrity verification
  @Prop({
    type: String
  })
  integrityHash: string;

  // Archive flag for retention policy (8 years per briefing)
  @Prop({
    type: Boolean,
    default: false,
    index: true
  })
  archived: boolean;

  @Prop({
    type: Date
  })
  archivedAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  updatedAt: Date;
}

export type SlotMachineTransactionDocument = HydratedDocument<SlotMachineTransaction>;

export const SlotMachineTransactionSchema = SchemaFactory.createForClass(SlotMachineTransaction);

// Create compound indexes for efficient querying
SlotMachineTransactionSchema.index({ userId: 1, createdAt: -1 });
SlotMachineTransactionSchema.index({ userId: 1, status: 1 });
SlotMachineTransactionSchema.index({ createdAt: -1, archived: 1 });
