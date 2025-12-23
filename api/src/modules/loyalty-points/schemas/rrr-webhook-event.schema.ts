import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RRRWebhookEventDocument = RRRWebhookEvent & Document;

/**
 * Schema for tracking processed webhook events (for idempotency)
 */
@Schema({ timestamps: true })
export class RRRWebhookEvent {
  @Prop({ required: true, unique: true, index: true })
  event_id: string;

  @Prop({ required: true })
  event_type: string;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ default: 'processed' })
  status: string;

  @Prop({ type: Date, default: Date.now, expires: 2592000 }) // 30 days TTL
  processed_at: Date;
}

export const RRRWebhookEventSchema = SchemaFactory.createForClass(RRRWebhookEvent);
