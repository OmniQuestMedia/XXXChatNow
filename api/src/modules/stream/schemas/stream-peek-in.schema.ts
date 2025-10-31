import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'stream_peek_ins'
})
export class StreamPeekIn {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  streamId: ObjectId | MongooseObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  userId: ObjectId | MongooseObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  performerId: ObjectId | MongooseObjectId;

  @Prop({
    type: String,
    default: 'private'
  })
  streamType: string;

  @Prop({
    type: Number,
    default: 0
  })
  token: number;

  @Prop({
    type: Number,
    default: 60
  })
  timeLimit: number;

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

export type StreamPeekInDocument = HydratedDocument<StreamPeekIn>;

export const StreamPeekInSchema = SchemaFactory.createForClass(StreamPeekIn);
