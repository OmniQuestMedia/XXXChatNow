import { Schema, Document, Types } from 'mongoose';
import ChipSchema, { IChip } from './chip';
import { IGoal, GoalSchema } from './goal';
interface GratitudeComment {
  text: string; // allows insertion of {username} as placeholder
}
interface GIFWAVTrigger {
  gifUrl?: string;
  wavUrl?: string;
}
interface DiscountModifiers {
  enabled: boolean;
  percent: number; // discount percent (0-100)
  durationMs: number;
  startTime: Date;
  endTime: Date;
  showDiscountedOnly: boolean;
  showTimer: boolean;
  gifWavAt?: {
    '1_3'?: GIFWAVTrigger;
    '1_2'?: GIFWAVTrigger;
    '2_3'?: GIFWAVTrigger;
    '15_min'?: GIFWAVTrigger;
    '10_min'?: GIFWAVTrigger;
    '5_min'?: GIFWAVTrigger;
    '2_min'?: GIFWAVTrigger;
  };
  countdownGifWavStart?: GIFWAVTrigger;
  countdownGifWavEnd?: GIFWAVTrigger;
}
interface BumpModifiers {
  enabled: boolean;
  percent: number; // bump percent (0-100, positive integer)
  durationMs?: number; // optional
  startTime?: Date;
  endTime?: Date;
  manualOff?: boolean;
}
export interface IMenu extends Document {
  modelId: Types.ObjectId;
  name: string; // e.g. 'Menu A', 'Admin Template B'
  isActive: boolean;
  chips: Types.DocumentArray<IChip>;
  gratitudeComments: GratitudeComment[]; // up to 6
  gratitudeRotationBuffer?: number[]; // recently used gratitude comments
  soundEnabled: boolean;
  animationEnabled: boolean;
  discountModifiers?: DiscountModifiers;
  bumpModifiers?: BumpModifiers;
  goal?: IGoal;
  themeSkinId?: Types.ObjectId | string; // skin/design chosen or custom uploaded
  createdAt: Date;
  updatedAt: Date;
}
const GratitudeCommentSchema = new Schema<GratitudeComment>({
  text: { type: String, maxlength: 200, required: true },
});
const GIFWAVTriggerSchema = new Schema<GIFWAVTrigger>({
  gifUrl: { type: String },
  wavUrl: { type: String },
}, { _id: false });
const DiscountModifiersSchema = new Schema<DiscountModifiers>({
  enabled: { type: Boolean, default: false },
  percent: { type: Number, min: 1, max: 99 },
  durationMs: { type: Number, min: 600000, max: 28800000 }, // 10m to 8hr in ms
  startTime: { type: Date },
  endTime: { type: Date },
  showDiscountedOnly: { type: Boolean, default: true },
  showTimer: { type: Boolean, default: false },
  gifWavAt: {
    type: Map,
    of: GIFWAVTriggerSchema,
    default: {},
  },
  countdownGifWavStart: GIFWAVTriggerSchema,
  countdownGifWavEnd: GIFWAVTriggerSchema,
}, { _id: false });
const BumpModifiersSchema = new Schema<BumpModifiers>({
  enabled: { type: Boolean, default: false },
  percent: { type: Number, min: 1, max: 99 },
  durationMs: { type: Number, min: 0 },
  startTime: { type: Date },
  endTime: { type: Date },
  manualOff: { type: Boolean, default: false },
}, { _id: false });
const MenuSchema = new Schema<IMenu>({
  modelId: { type: Schema.Types.ObjectId, ref: 'Model', required: true },
  name: { type: String, maxlength: 25, required: true },
  isActive: { type: Boolean, default: false },
  chips: { type: [ChipSchema], default: [] },
  gratitudeComments: { type: [GratitudeCommentSchema], default: [], maxlength: 6 },
  soundEnabled: { type: Boolean, default: true },
  animationEnabled: { type: Boolean, default: true },
  discountModifiers: { type: DiscountModifiersSchema, default: undefined },
  bumpModifiers: { type: BumpModifiersSchema, default: undefined },
  goal: { type: GoalSchema, default: undefined },
  themeSkinId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
MenuSchema.index({ modelId: 1, name: 1 }, { unique: true });
export default MenuSchema;
