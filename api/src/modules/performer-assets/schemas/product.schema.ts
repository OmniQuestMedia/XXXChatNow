import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performerproducts'
})
export class Product {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  digitalFileId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  imageId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  publish: boolean;

  @Prop({
    default: 'physical'
  })
  type: string;

  @Prop({
    default: 'active'
  })
  status: string;

  @Prop({
    default: 0
  })
  token: number;

  @Prop({
    default: 0
  })
  stock: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  createdBy: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  updatedBy: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

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

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({
  performerId: 1,
  status: 1
});
