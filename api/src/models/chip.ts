import { Schema, Document, Types } from 'mongoose';
/**
 * Single Chip (Menu Item) Schema
 * - Each chip can optionally have a GIF and/or WAV file attached.
 * - Includes token price, label, type, state, and order.
 */
export interface IChip extends Document {
  label: string;
  description?: string; // Up to 100 chars
  price: number; // Up to 99,999 (or whatever your site max)
  gifUrl?: string;
  wavUrl?: string;
  type: 'action' | 'toy';
  enabled: boolean;
  orderIndex: number;
}
export const ChipSchema = new Schema<IChip>({
  label: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 100 },
  price: { type: Number, required: true, min: 0, max: 99999 },
  gifUrl: { type: String },
  wavUrl: { type: String },
  type: { type: String, enum: ['action', 'toy'], required: true },
  enabled: { type: Boolean, default: true },
  orderIndex: { type: Number, required: true },
});
export default ChipSchema;
