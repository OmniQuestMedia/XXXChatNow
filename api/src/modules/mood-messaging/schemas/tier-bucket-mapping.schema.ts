import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'tier_bucket_mappings'
})
export class TierBucketMapping {
  @Prop({
    required: true,
    unique: true,
    index: true
  })
  tierKey: string;

  @Prop({
    required: true
  })
  tierName: string;

  @Prop()
  description: string;

  @Prop({
    type: [String],
    required: true
  })
  buckets: string[];

  @Prop({
    default: false
  })
  hasSecondaryMicro: boolean;

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

export type TierBucketMappingDocument = HydratedDocument<TierBucketMapping>;

export const TierBucketMappingSchema = SchemaFactory.createForClass(TierBucketMapping);

TierBucketMappingSchema.index({ tierKey: 1 });
