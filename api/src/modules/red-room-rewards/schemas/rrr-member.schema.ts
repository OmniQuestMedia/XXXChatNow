/**
 * RedRoomRewards Member Schema
 * 
 * Represents a member in the RRR loyalty system
 * Members can be consumers or models
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TrustLevel, MemberType, AccountStatus } from '../constants';

@Schema({
  collection: 'rrr_members',
  timestamps: true,
})
export class RRRMember {
  @Prop({ required: true, unique: true })
  memberId: string; // unique RRR member identifier

  @Prop({ required: true, enum: Object.values(MemberType), default: MemberType.CONSUMER })
  memberType: string;

  @Prop({ required: true, enum: Object.values(TrustLevel), default: TrustLevel.L0 })
  trustLevel: string;

  @Prop({ required: true, enum: Object.values(AccountStatus), default: AccountStatus.ACTIVE })
  status: string;

  @Prop()
  emailVerified: boolean;

  @Prop()
  phoneVerified: boolean;

  @Prop()
  hashedEmail: string; // hashed for PII protection

  @Prop()
  hashedPhone: string; // hashed for PII protection

  @Prop({ default: 0 })
  balance: number; // current points balance

  @Prop()
  lastNegativeEventAt: Date; // timestamp of last fraud flag or negative event

  @Prop({ default: false })
  hasFraudFlags: boolean;

  @Prop()
  accountCreatedAt: Date;

  @Prop()
  firstTransferAt: Date; // timestamp of first transfer (for cooling period)

  @Prop()
  lastTransferAt: Date;

  @Prop({ default: 0 })
  totalPointsEarned: number;

  @Prop({ default: 0 })
  totalPointsSpent: number;

  @Prop({ default: 0 })
  totalPointsTransferredOut: number;

  @Prop({ default: 0 })
  totalPointsTransferredIn: number;

  @Prop({ default: 0 })
  totalPointsAwarded: number; // for models

  @Prop()
  mergedIntoMemberId: string; // if this account was merged into another

  @Prop()
  mergedAt: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type RRRMemberDocument = HydratedDocument<RRRMember>;

export const RRRMemberSchema = SchemaFactory.createForClass(RRRMember);

// Indexes
RRRMemberSchema.index({ memberId: 1 }, { unique: true });
RRRMemberSchema.index({ status: 1 });
RRRMemberSchema.index({ trustLevel: 1 });
RRRMemberSchema.index({ memberType: 1 });
RRRMemberSchema.index({ mergedIntoMemberId: 1 });
