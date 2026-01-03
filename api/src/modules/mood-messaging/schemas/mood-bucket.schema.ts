import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'mood_buckets'
})
export class MoodBucket {
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  key: string;

  @Prop({
    required: true
  })
  name: string;

  @Prop()
  description: string;

  @Prop({
    type: [String],
    required: true
  })
  responses: string[];

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

MoodBucketSchema.index({ key: 1 });
