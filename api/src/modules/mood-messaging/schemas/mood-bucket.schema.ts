import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * MoodBucket Schema
 * Stores predefined mood-based response templates
 */
@Schema({
  collection: 'moodbuckets'
})
export class MoodBucket {
  @Prop({
    required: true,
    index: true,
    unique: true
  })
  name: string;

  @Prop({
    required: true
  })
  description: string;

  @Prop({
    required: true,
    enum: ['public_gratitude', 'private_micro'],
    index: true
  })
  category: string;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'Responses array must contain at least one response'
    }
  })
  responses: string[];

  @Prop({
    default: false
  })
  isDefault: boolean;

  @Prop({
    required: true,
    enum: ['public', 'private']
  })
  visibility: string;

  @Prop({
    default: true,
    index: true
  })
  active: boolean;

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

export type MoodBucketDocument = HydratedDocument<MoodBucket>;

export const MoodBucketSchema = SchemaFactory.createForClass(MoodBucket);

// Compound index for active buckets by category
MoodBucketSchema.index({ category: 1, active: 1 });

// Update the updatedAt timestamp on save
MoodBucketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
