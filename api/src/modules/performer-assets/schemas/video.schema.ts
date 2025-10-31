import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performervideos'
})
export class Video {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  fileId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  trailerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({
    default: 'active'
  })
  status: string;

  @Prop({
    default: 0
  })
  token: number;

  @Prop()
  processing: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  thumbnailId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    default: false
  })
  isSaleVideo: boolean;

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

export type VideoDocument = HydratedDocument<Video>;

export const VideoSchema = SchemaFactory.createForClass(Video);

VideoSchema.index({
  performerId: 1,
  status: 1
});
