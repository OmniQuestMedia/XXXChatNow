import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';

@Schema({
  collection: 'streams'
})
export class Stream {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  type: string;

  @Prop()
  sessionId: string;

  @Prop({
    default: false
  })
  isStreaming: boolean;

  @Prop({
    type: [{
      type: MongooseSchema.Types.ObjectId
    }]
  })
  userIds: Array<ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId>;

  @Prop({
    type: [{
      type: String
    }]
  })
  streamIds: string[];

  @Prop()
  lastStreamingTime: Date;

  @Prop({
    default: 0
  })
  streamingTime: number;

  @Prop({
    default: 0
  })
  totalViewer: number;

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

export type StreamDocument = HydratedDocument<Stream>;

export const StreamSchema = SchemaFactory.createForClass(Stream);

StreamSchema.index({ performerId: 1, type: 1 });
StreamSchema.index({ sessionId: 1 });
