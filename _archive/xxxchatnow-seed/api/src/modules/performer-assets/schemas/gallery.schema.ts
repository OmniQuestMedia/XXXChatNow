import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performergalleries'
})
export class Gallery {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({
    default: 'active'
  })
  status: string;

  @Prop({
    default: true
  })
  isSale: boolean;

  @Prop()
  token: number;

  @Prop({
    default: 0
  })
  numOfItems: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  coverPhotoId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

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

export type GalleryDocument = HydratedDocument<Gallery>;

export const GallerySchema = SchemaFactory.createForClass(Gallery);

GallerySchema.index({
  performerId: 1,
  status: 1
});
