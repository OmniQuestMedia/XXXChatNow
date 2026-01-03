/**
 * Menu Item Schema
 * 
 * Represents individual purchasable items in a model's performance menu.
 * All token values and pricing are server-side enforced for security.
 * 
 * Reference: MODEL_PERFORMANCE_MENU.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Lovense device activation configuration
 */
@Schema({ _id: false })
export class LovenseActivation {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ required: false, enum: ['vibrator', 'pump', 'all'] })
  device_type?: string;

  @Prop({ required: false, min: 1, max: 20 })
  intensity?: number;

  @Prop({ required: false, min: 0 })
  duration_ms?: number;

  @Prop({ required: false, min: 0, default: 0 })
  timing_offset?: number;

  @Prop({ required: false, enum: ['pulse', 'wave', 'steady', 'custom'] })
  pattern?: string;
}

export const LovenseActivationSchema = SchemaFactory.createForClass(LovenseActivation);

/**
 * Menu Item document
 */
@Schema({
  collection: 'menu_items',
  timestamps: true
})
export class MenuItem extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  token_value: number;

  @Prop({ required: false, min: 0, default: 0 })
  bonus_loyalty_points: number;

  @Prop({ type: LovenseActivationSchema, required: false })
  lovense_activation?: LovenseActivation;

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: true, default: 0 })
  display_order: number;

  @Prop({ required: false, trim: true })
  category?: string;

  @Prop({ required: false })
  icon_url?: string;

  @Prop({ required: false, min: 0 })
  max_daily_purchases?: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  created_by: MongooseSchema.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

// Create indexes for efficient queries
MenuItemSchema.index({ is_active: 1, display_order: 1 });
MenuItemSchema.index({ category: 1, is_active: 1 });
MenuItemSchema.index({ created_by: 1 });
