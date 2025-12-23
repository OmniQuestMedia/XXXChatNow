/**
 * RedRoomRewards Transfer Schema
 * 
 * Tracks point transfers between members
 * Includes member-to-member transfers and model awards
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TransferStatus } from '../constants';

@Schema({
  collection: 'rrr_transfers',
  timestamps: true,
})
export class RRRTransfer {
  @Prop({ required: true, unique: true })
  transferId: string; // unique transfer identifier (correlationId in ledger)

  @Prop({ required: true })
  senderMemberId: string;

  @Prop({ required: true })
  receiverMemberId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: Object.values(TransferStatus), default: TransferStatus.PENDING })
  status: string;

  @Prop({ default: false })
  isModelAward: boolean; // true if this is a model-to-viewer award

  @Prop()
  streamId: string; // for model awards: stream/room identifier

  @Prop()
  sessionProof: string; // for model awards: hashed session proof

  @Prop()
  senderLedgerEntryId: string;

  @Prop()
  receiverLedgerEntryId: string;

  @Prop()
  reversalTransferId: string; // if reversed, the reversal transfer ID

  @Prop()
  reversedAt: Date;

  @Prop()
  reversalReason: string;

  @Prop()
  reversalActorId: string; // admin who reversed

  @Prop()
  escrowReason: string; // if escrowed, why

  @Prop()
  escrowedAt: Date;

  @Prop()
  releasedAt: Date; // when released from escrow

  @Prop()
  completedAt: Date;

  @Prop()
  riskScore: number; // calculated risk score (for velocity checks)

  @Prop()
  deviceClusterHash: string; // hashed device identifier

  @Prop()
  metadata: Record<string, any>; // flexible metadata

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type RRRTransferDocument = HydratedDocument<RRRTransfer>;

export const RRRTransferSchema = SchemaFactory.createForClass(RRRTransfer);

// Indexes
RRRTransferSchema.index({ transferId: 1 }, { unique: true });
RRRTransferSchema.index({ senderMemberId: 1, createdAt: -1 });
RRRTransferSchema.index({ receiverMemberId: 1, createdAt: -1 });
RRRTransferSchema.index({ status: 1 });
RRRTransferSchema.index({ isModelAward: 1, createdAt: -1 });
RRRTransferSchema.index({ streamId: 1 }, { sparse: true });
