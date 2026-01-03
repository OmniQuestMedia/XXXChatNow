/**
 * Menu Schema
 * 
 * Represents a model's performance menu containing multiple menu items.
 * Supports queue modes, visibility controls, and theme customization.
 * 
 * Reference: MODEL_PERFORMANCE_MENU.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Menu theme customization
 */
@Schema({ _id: false })
export class MenuTheme {
  @Prop({ required: false })
  primary_color?: string;

  @Prop({ required: false })
  secondary_color?: string;

  @Prop({ required: false, enum: ['modern', 'premium', 'luxury', 'minimal'] })
  card_style?: string;
}

export const MenuThemeSchema = SchemaFactory.createForClass(MenuTheme);

/**
 * Menu document
 */
@Schema({
  collection: 'menus',
  timestamps: true
})
export class Menu extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  model_id: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' }], 
    required: true,
    default: []
  })
  menu_items: MongooseSchema.Types.ObjectId[];

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: true, enum: ['ON', 'OFF'], default: 'OFF' })
  queue_mode: string;

  @Prop({ 
    required: true, 
    enum: ['public', 'subscribers_only', 'private'], 
    default: 'public' 
  })
  visibility: string;

  @Prop({ type: MenuThemeSchema, required: false })
  theme?: MenuTheme;

  @Prop({ 
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], 
    required: false,
    default: []
  })
  whitelist_users?: MongooseSchema.Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

// Create indexes for efficient queries
MenuSchema.index({ model_id: 1, is_active: 1 });
MenuSchema.index({ visibility: 1, is_active: 1 });
MenuSchema.index({ model_id: 1, name: 1 });
