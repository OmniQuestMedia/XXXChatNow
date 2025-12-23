import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { ObjectId } from 'mongodb';
import { RRRLinkType, RRRLinkStatus } from '../constants';

/**
 * Local schema to store RRR account linking information
 * This allows us to map XCN users to RRR member IDs
 */
@Schema({
  collection: 'rrr_account_links'
})
export class RRRAccountLink {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  userId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true
  })
  rrrMemberId: string;

  @Prop({
    type: String,
    enum: Object.values(RRRLinkType),
    required: true
  })
  linkType: RRRLinkType;

  @Prop({
    type: String,
    enum: Object.values(RRRLinkStatus),
    default: RRRLinkStatus.ACTIVE
  })
  status: RRRLinkStatus;

  @Prop()
  intentId: string;

  @Prop()
  linkCode: string;

  @Prop({
    type: Date
  })
  linkedAt: Date;

  @Prop({
    type: Date
  })
  expiresAt: Date;

  @Prop({
    type: Object
  })
  metadata: Record<string, any>;

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

export type RRRAccountLinkDocument = HydratedDocument<RRRAccountLink>;

export const RRRAccountLinkSchema = SchemaFactory.createForClass(RRRAccountLink);

// Indexes
RRRAccountLinkSchema.index({ userId: 1 }, { unique: true });
RRRAccountLinkSchema.index({ rrrMemberId: 1 }, { unique: true });
RRRAccountLinkSchema.index({ status: 1 });
RRRAccountLinkSchema.index({ createdAt: 1 });
