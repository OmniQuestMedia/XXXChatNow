import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'aggregatorcategories'
})
export class AggregatorCategory {
  @Prop()
  name: string;

  @Prop({
    index: true,
    unique: true
  })
  alias: string;

  @Prop({
    default: true
  })
  active: boolean;

  @Prop({
    type: [{
      type: String
    }]
  })
  tags: string[];

  @Prop()
  metaTitle: string;

  @Prop()
  metaKeywords: string;

  @Prop()
  metaDescription: string;

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

export type AggregatorCategoryDocument = HydratedDocument<AggregatorCategory>;

export const AggregatorCategorySchema = SchemaFactory.createForClass(AggregatorCategory);
