import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'public_micro_gratitude'
})
export class PublicMicroGratitude {
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  responseId: number;

  @Prop({
    required: true
  })
  text: string;

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

export type PublicMicroGratitudeDocument = HydratedDocument<PublicMicroGratitude>;

export const PublicMicroGratitudeSchema = SchemaFactory.createForClass(PublicMicroGratitude);

PublicMicroGratitudeSchema.index({ responseId: 1 });
