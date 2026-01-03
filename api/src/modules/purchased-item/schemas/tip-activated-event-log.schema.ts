import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * TipActivatedEventLog schema
 * Stores emitted TipActivated events for idempotency tracking
 * Keyed by tipId to prevent duplicate event emissions
 */
@Schema({
  collection: 'tip_activated_event_log',
  timestamps: true
})
export class TipActivatedEventLog {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true
  })
  tipId: string;

  @Prop({
    type: String,
    required: true
  })
  eventId: string;

  @Prop({
    type: String,
    required: true,
    index: true
  })
  ledgerId: string;

  @Prop({
    type: String,
    required: true,
    index: true
  })
  sourceRef: string;

  @Prop({
    type: Date,
    required: true
  })
  postedAt: Date;

  @Prop({
    type: String,
    required: true
  })
  payloadHash: string;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;
}

export type TipActivatedEventLogDocument = HydratedDocument<TipActivatedEventLog>;

export const TipActivatedEventLogSchema = SchemaFactory.createForClass(TipActivatedEventLog);

// Create additional indexes for query performance
TipActivatedEventLogSchema.index({ ledgerId: 1 });
TipActivatedEventLogSchema.index({ sourceRef: 1 });
TipActivatedEventLogSchema.index({ createdAt: -1 });
