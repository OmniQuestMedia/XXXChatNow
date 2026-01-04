import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { MoodState } from '../constants';

export type MoodStateDocument = HydratedDocument<ModelMoodState>;

/**
 * Model Mood State Schema
 * Stores the current mood state for each performer/model
 * Reference: MOOD_MESSAGING_BRIEFING.md - Data Models section
 */
@Schema({
  collection: 'model_mood_states',
  timestamps: true
})
export class ModelMoodState {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'Performer',
    unique: true,
    index: true
  })
  modelId: MongooseObjectId;

  @Prop({
    type: String,
    enum: Object.values(MoodState),
    required: true,
    default: MoodState.NEUTRAL,
    index: true
  })
  moodState: MoodState;

  @Prop({
    type: String,
    maxlength: 200
  })
  customMessage?: string;

  @Prop({
    type: Boolean,
    default: false
  })
  autoRespond: boolean;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 300
  })
  responseDelay: number;

  @Prop({
    type: Date
  })
  expiresAt?: Date;

  @Prop({
    type: String,
    enum: ['model', 'admin', 'system'],
    required: true,
    default: 'model'
  })
  updatedBy: string;

  @Prop({
    type: String
  })
  adminReason?: string;
}

export const ModelMoodStateSchema = SchemaFactory.createForClass(ModelMoodState);

// Create compound index for efficient queries
ModelMoodStateSchema.index({ modelId: 1, moodState: 1 });
