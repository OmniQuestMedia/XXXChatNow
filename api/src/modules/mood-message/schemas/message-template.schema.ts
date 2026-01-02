/**
 * Message Template Schema
 * 
 * Stores predefined message templates for different moods and contexts.
 * Supports template versioning and A/B testing.
 * 
 * Reference: MODEL_MOOD_RESPONSE_SYSTEM.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Message Template document
 */
@Schema({
  collection: 'message_templates',
  timestamps: true
})
export class MessageTemplate extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ 
    required: true, 
    enum: ['happy', 'sad', 'angry', 'neutral', 'excited', 'anxious'] 
  })
  mood: string;

  @Prop({ 
    required: true, 
    enum: ['public_micro', 'private_custom', 'escalation_auto'] 
  })
  message_type: string;

  @Prop({ required: true })
  template_content: string;

  @Prop({ 
    required: true, 
    enum: ['free', 'basic', 'premium', 'vip', 'all'], 
    default: 'all' 
  })
  target_tier: string;

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ required: false, default: 0 })
  usage_count: number;

  @Prop({ required: false, default: 0 })
  success_rate: number;

  @Prop({ type: [String], required: false, default: [] })
  tags: string[];

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  variables?: any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  created_by?: MongooseSchema.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageTemplateSchema = SchemaFactory.createForClass(MessageTemplate);

// Create indexes for efficient queries
MessageTemplateSchema.index({ mood: 1, message_type: 1, is_active: 1 });
MessageTemplateSchema.index({ target_tier: 1, is_active: 1 });
MessageTemplateSchema.index({ tags: 1 });
MessageTemplateSchema.index({ version: 1 });
MessageTemplateSchema.index({ usage_count: -1 });
