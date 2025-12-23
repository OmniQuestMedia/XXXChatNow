/**
 * RedRoomRewards Client Profile Link Schema
 * 
 * Links a client profile (e.g., XCN user) to an RRR member
 * Enforces one-to-one linking between client profile and RRR member (Section 2.3)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LinkStatus } from '../constants';

@Schema({
  collection: 'rrr_profile_links',
  timestamps: true,
})
export class RRRProfileLink {
  @Prop({ required: true })
  memberId: string; // RRR member ID

  @Prop({ required: true })
  clientId: string; // client identifier (e.g., 'XCN')

  @Prop({ required: true })
  clientProfileId: string; // client user/profile ID

  @Prop({ required: true, enum: Object.values(LinkStatus), default: LinkStatus.ACTIVE })
  status: string;

  @Prop()
  linkedAt: Date;

  @Prop()
  retiredAt: Date; // when marked as retired during merge

  @Prop()
  retiredReason: string; // reason for retirement

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type RRRProfileLinkDocument = HydratedDocument<RRRProfileLink>;

export const RRRProfileLinkSchema = SchemaFactory.createForClass(RRRProfileLink);

// Indexes
RRRProfileLinkSchema.index({ memberId: 1, clientId: 1 });
RRRProfileLinkSchema.index({ clientId: 1, clientProfileId: 1, status: 1 }, { unique: true }); // enforce one-to-one
RRRProfileLinkSchema.index({ status: 1 });
