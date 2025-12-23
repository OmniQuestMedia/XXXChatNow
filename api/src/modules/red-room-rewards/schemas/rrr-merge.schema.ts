/**
 * RedRoomRewards Account Merge Schema
 * 
 * Tracks account merge requests and approvals
 * Two-stage approval process (Section 5.4)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MergeStatus } from '../constants';

@Schema({
  collection: 'rrr_merges',
  timestamps: true,
})
export class RRRMerge {
  @Prop({ required: true, unique: true })
  mergeId: string;

  @Prop({ required: true })
  sourceMemberId: string; // account being merged from

  @Prop({ required: true })
  targetMemberId: string; // account being merged into

  @Prop({ required: true, enum: Object.values(MergeStatus), default: MergeStatus.PENDING })
  status: string;

  @Prop()
  clientId: string; // client identifier (e.g., 'XCN')

  @Prop()
  requestReason: string;

  @Prop()
  ticketReference: string; // client ticket/case ID

  @Prop({ type: [String] })
  evidenceTypes: string[]; // array of evidence types provided

  @Prop()
  evidenceSummary: string; // summary of evidence (no raw PII)

  @Prop({ type: [String] })
  clientAdminApprovals: string[]; // array of admin IDs who approved (stage 1)

  @Prop()
  rrrAdminApproval: string; // RRR admin ID who approved (stage 2)

  @Prop()
  stage1ApprovedAt: Date;

  @Prop()
  stage2ApprovedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop()
  rejectedAt: Date;

  @Prop()
  rejectionReason: string;

  @Prop()
  rejectedBy: string;

  @Prop()
  pointsTransferred: number; // total points moved

  @Prop()
  survivingClientProfileId: string; // which client profile remains linked

  @Prop()
  retiredClientProfileId: string; // which client profile was retired

  @Prop({ type: [String] })
  ledgerEntryIds: string[]; // ledger entries created for this merge

  @Prop()
  auditNote: string; // admin note for audit purposes

  @Prop()
  userAcknowledgement: boolean; // user acknowledged merge terms

  @Prop()
  metadata: Record<string, any>;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type RRRMergeDocument = HydratedDocument<RRRMerge>;

export const RRRMergeSchema = SchemaFactory.createForClass(RRRMerge);

// Indexes
RRRMergeSchema.index({ mergeId: 1 }, { unique: true });
RRRMergeSchema.index({ sourceMemberId: 1 });
RRRMergeSchema.index({ targetMemberId: 1 });
RRRMergeSchema.index({ status: 1 });
RRRMergeSchema.index({ createdAt: -1 });
