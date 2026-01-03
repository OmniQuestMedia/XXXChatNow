/**
 * Mood Message Schema
 * 
 * Tracks all mood-based messages with complete delivery status and audit trail.
 * Implements fully-trackable message delivery system.
 * 
 * Reference: MODEL_MOOD_RESPONSE_SYSTEM.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Mood Message document
 */
@Schema({
  collection: 'mood_messages',
  timestamps: true
})
export class MoodMessage extends Document {
  @Prop({ required: true, unique: true })
  message_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  model_id?: MongooseSchema.Types.ObjectId;

  @Prop({ 
    required: true, 
    enum: ['public_micro', 'private_custom', 'escalation_auto'] 
  })
  message_type: string;

  @Prop({ 
    required: true, 
    enum: ['happy', 'sad', 'angry', 'neutral', 'excited', 'anxious', 'unknown'] 
  })
  detected_mood: string;

  @Prop({ required: true, min: 0, max: 100 })
  mood_confidence: number;

  @Prop({ required: false })
  template_id?: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  metadata?: any;

  @Prop({ 
    required: true, 
    enum: ['free', 'basic', 'premium', 'vip'], 
    default: 'free' 
  })
  user_tier: string;

  @Prop({ required: true, min: 1, max: 10, default: 5 })
  priority: number;

  @Prop({ 
    required: true, 
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ required: false })
  sent_at?: Date;

  @Prop({ required: false })
  delivered_at?: Date;

  @Prop({ required: false })
  read_at?: Date;

  @Prop({ required: false })
  failed_at?: Date;

  @Prop({ required: false })
  failure_reason?: string;

  @Prop({ required: true, default: 0, min: 0 })
  retry_count: number;

  @Prop({ required: false })
  conversation_id?: string;

  @Prop({ required: false, default: false })
  is_automated: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MoodMessageSchema = SchemaFactory.createForClass(MoodMessage);

// Create indexes for efficient queries
MoodMessageSchema.index({ message_id: 1 }, { unique: true });
MoodMessageSchema.index({ user_id: 1, createdAt: -1 });
MoodMessageSchema.index({ model_id: 1, status: 1 });
MoodMessageSchema.index({ status: 1, priority: -1, createdAt: 1 });
MoodMessageSchema.index({ message_type: 1, detected_mood: 1 });
MoodMessageSchema.index({ user_tier: 1, priority: -1 });
MoodMessageSchema.index({ conversation_id: 1 }, { sparse: true });
MoodMessageSchema.index({ createdAt: 1 });
