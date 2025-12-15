import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performerphotos'
})
export class Photo {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  galleryId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;
  // original file

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  fileId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({
    default: 'active'
  })
  status: string;

  @Prop()
  processing: boolean;

  @Prop({
    default: false
  })
  isGalleryCover: boolean;

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

export type PhotoDocument = HydratedDocument<Photo>;

export const PhotoSchema = SchemaFactory.createForClass(Photo);

PhotoSchema.index({
  performerId: 1,
  status: 1
});
