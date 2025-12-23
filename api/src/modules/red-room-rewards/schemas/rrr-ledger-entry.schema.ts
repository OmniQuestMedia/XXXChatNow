/**
 * RedRoomRewards Ledger Entry Schema
 * 
 * Immutable append-only ledger for all points transactions
 * Supports double-entry bookkeeping for transfers
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TransactionType, PointsSourceType } from '../constants';

@Schema({
  collection: 'rrr_ledger',
  timestamps: true,
})
export class RRRLedgerEntry {
  @Prop({ required: true, unique: true })
  ledgerEntryId: string; // unique identifier for this ledger entry

  @Prop({ required: true })
  memberId: string; // member this entry belongs to

  @Prop({ required: true, enum: Object.values(TransactionType) })
  transactionType: string;

  @Prop({ required: true })
  amount: number; // positive for credits, negative for debits

  @Prop({ required: true })
  balanceAfter: number; // balance after this transaction

  @Prop({ enum: Object.values(PointsSourceType) })
  sourceType: string;

  @Prop()
  expiresAt: Date; // expiry date for this points batch

  @Prop()
  correlationId: string; // links related entries (e.g., transfer_id for transfers)

  @Prop()
  idempotencyKey: string; // for idempotent operations

  @Prop()
  relatedMemberId: string; // for transfers: the other party

  @Prop()
  relatedLedgerEntryId: string; // for transfers: the counterpart entry

  @Prop()
  adminActorId: string; // for manual adjustments

  @Prop()
  reasonCode: string; // for manual adjustments

  @Prop()
  privateNote: string; // for manual adjustments (admin only)

  @Prop()
  reversalOfEntryId: string; // if this is a reversal, the original entry ID

  @Prop()
  reversedByEntryId: string; // if this entry was reversed, the reversal entry ID

  @Prop({ default: false })
  isReversed: boolean;

  @Prop({ default: false })
  isExpired: boolean;

  @Prop()
  clientId: string; // client identifier (e.g., 'XCN')

  @Prop()
  sessionProof: string; // for model awards: hashed session/stream proof

  @Prop()
  metadata: Record<string, any>; // flexible metadata field

  @Prop({ type: Date, default: Date.now })
  transactionDate: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type RRRLedgerEntryDocument = HydratedDocument<RRRLedgerEntry>;

export const RRRLedgerEntrySchema = SchemaFactory.createForClass(RRRLedgerEntry);

// Indexes
RRRLedgerEntrySchema.index({ ledgerEntryId: 1 }, { unique: true });
RRRLedgerEntrySchema.index({ memberId: 1, transactionDate: -1 });
RRRLedgerEntrySchema.index({ correlationId: 1 });
RRRLedgerEntrySchema.index({ idempotencyKey: 1 }, { sparse: true });
RRRLedgerEntrySchema.index({ transactionType: 1 });
RRRLedgerEntrySchema.index({ expiresAt: 1 }, { sparse: true });
RRRLedgerEntrySchema.index({ transactionDate: 1 }); // for archival queries
