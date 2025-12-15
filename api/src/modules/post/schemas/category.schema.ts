import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'postcategories'
})
export class Category {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  parentId: MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop()
  title: string;

  @Prop({
    index: true
  })
  slug: string;

  @Prop()
  description: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  updatedBy: MongooseSchema.Types.ObjectId;

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

export type CategoryDocument = HydratedDocument<Category>;

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ type: 1, slug: 1 }, {
  name: 'idx_type_slug',
  unique: true
});
