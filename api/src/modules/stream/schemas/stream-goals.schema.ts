import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'stream_goals'
})
export class StreamGoal {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  streamId: ObjectId | MongooseObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId;

  @Prop({
    type: String
  })
  description: string;

  @Prop({
    type: Number,
    default: 0
  })
  remainToken: number;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  goals: Record<string, any>;

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

export type StreamGoalDocument = HydratedDocument<StreamGoal>;

export const StreamGoalSchema = SchemaFactory.createForClass(StreamGoal);
