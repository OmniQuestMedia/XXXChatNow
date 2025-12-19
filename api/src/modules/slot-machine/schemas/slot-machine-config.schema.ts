/**
 * Slot Machine Configuration Schema
 * 
 * This schema stores versioned configuration for slot machine odds, payouts, and rules.
 * Hot-reloadable without deployment as per briefing requirements.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (Model Configuration Rules section)
 */

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  _id: false
})
export class SlotSymbol {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, min: 0, max: 1 })
  rarity: number;

  @Prop({ required: true, min: 0 })
  payout_3x: number;
}

const SlotSymbolSchema = SchemaFactory.createForClass(SlotSymbol);

@Schema({
  collection: 'slot_machine_configs',
  timestamps: true
})
export class SlotMachineConfig {
  @Prop({
    type: String,
    required: true,
    index: true
  })
  configName: string;

  @Prop({
    type: Number,
    required: true
  })
  version: number;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
    index: true
  })
  isActive: boolean;

  @Prop({
    type: Number,
    required: true,
    min: 1
  })
  spinCost: number;

  @Prop({
    type: [SlotSymbolSchema],
    required: true
  })
  symbols: SlotSymbol[];

  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 1
  })
  returnToPlayer: number;

  @Prop({
    type: Number,
    required: true,
    min: 1
  })
  maxSpinsPerHour: number;

  @Prop({
    type: Date,
    required: true,
    default: Date.now
  })
  effectiveDate: Date;

  @Prop({
    type: String,
    required: true
  })
  createdBy: string;

  @Prop({
    type: String
  })
  notes: string;

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

export type SlotMachineConfigDocument = HydratedDocument<SlotMachineConfig>;

export const SlotMachineConfigSchema = SchemaFactory.createForClass(SlotMachineConfig);

// Ensure only one active config at a time
SlotMachineConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
SlotMachineConfigSchema.index({ configName: 1, version: 1 }, { unique: true });
