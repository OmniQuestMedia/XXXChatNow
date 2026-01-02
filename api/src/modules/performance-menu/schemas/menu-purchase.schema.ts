/**
 * Menu Purchase Schema
 * 
 * Tracks all menu item purchases with complete audit trail.
 * Handles both immediate (queue OFF) and escrow (queue ON) transactions.
 * 
 * Reference: MODEL_PERFORMANCE_MENU.md, SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Menu Purchase document
 */
@Schema({
  collection: 'menu_purchases',
  timestamps: true
})
export class MenuPurchase extends Document {
  @Prop({ required: true, unique: true })
  purchase_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  model_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Menu', required: true })
  menu_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MenuItem', required: true })
  menu_item_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 0 })
  token_value: number;

  @Prop({ required: false, min: 0, default: 0 })
  loyalty_points_awarded: number;

  @Prop({ 
    required: true, 
    enum: ['immediate', 'queued'], 
    default: 'immediate' 
  })
  transaction_type: string;

  @Prop({ 
    required: true, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'QueueRequest', required: false })
  queue_request_id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  queue_position?: number;

  @Prop({ required: false })
  estimated_wait_minutes?: number;

  @Prop({ required: false })
  completed_at?: Date;

  @Prop({ required: false })
  failed_at?: Date;

  @Prop({ required: false })
  refunded_at?: Date;

  @Prop({ required: false })
  failure_reason?: string;

  @Prop({ required: false })
  refund_reason?: string;

  @Prop({ required: false, unique: true, sparse: true })
  idempotency_key?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  metadata?: any;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MenuPurchaseSchema = SchemaFactory.createForClass(MenuPurchase);

// Create indexes for efficient queries
MenuPurchaseSchema.index({ purchase_id: 1 }, { unique: true });
MenuPurchaseSchema.index({ user_id: 1, createdAt: -1 });
MenuPurchaseSchema.index({ model_id: 1, status: 1 });
MenuPurchaseSchema.index({ menu_id: 1, status: 1 });
MenuPurchaseSchema.index({ status: 1, transaction_type: 1 });
MenuPurchaseSchema.index({ idempotency_key: 1 }, { sparse: true, unique: true });
MenuPurchaseSchema.index({ queue_request_id: 1 }, { sparse: true });
MenuPurchaseSchema.index({ createdAt: 1 });
