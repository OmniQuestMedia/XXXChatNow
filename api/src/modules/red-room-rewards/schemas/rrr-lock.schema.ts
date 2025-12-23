/**
 * RedRoomRewards Account Lock Schema
 * 
 * Tracks locks placed on member accounts
 * Section 8: Holds, Locks, and Enforcement
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LockType } from '../constants';

@Schema({
  collection: 'rrr_locks',
  timestamps: true,
})
export class RRRLock {
  @Prop({ required: true, unique: true })
  lockId: string;

  @Prop({ required: true })
  memberId: string;

  @Prop({ required: true, enum: Object.values(LockType) })
  lockType: string;

  @Prop({ required: true })
  reasonCode: string;

  @Prop()
  reasonDescription: string;

  @Prop({ required: true })
  imposedBy: string; // admin ID who imposed the lock

  @Prop()
  imposedAt: Date;

  @Prop()
  expiresAt: Date; // optional time-bound lock

  @Prop()
  releasedAt: Date;

  @Prop()
  releasedBy: string; // admin ID who released the lock

  @Prop()
  releaseReason: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  metadata: Record<string, any>;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type RRRLockDocument = HydratedDocument<RRRLock>;

export const RRRLockSchema = SchemaFactory.createForClass(RRRLock);

// Indexes
RRRLockSchema.index({ lockId: 1 }, { unique: true });
RRRLockSchema.index({ memberId: 1, isActive: 1 });
RRRLockSchema.index({ lockType: 1, isActive: 1 });
RRRLockSchema.index({ expiresAt: 1 }, { sparse: true });
