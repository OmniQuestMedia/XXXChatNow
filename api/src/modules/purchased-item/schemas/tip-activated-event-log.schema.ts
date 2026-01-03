import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'tip_activated_event_logs'
})
export class TipActivatedEventLog {
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  tipId: string;

  @Prop({
    required: true
  })
  eventId: string;

  @Prop({
    index: true
  })
  sourceRef: string;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;
}

export type TipActivatedEventLogDocument = HydratedDocument<TipActivatedEventLog>;

export const TipActivatedEventLogSchema = SchemaFactory.createForClass(TipActivatedEventLog);
