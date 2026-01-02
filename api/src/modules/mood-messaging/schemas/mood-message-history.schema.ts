import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'mood_message_history'
})
export class MoodMessageHistory {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true
  })
  userId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    enum: ['private_mood', 'public_micro_gratitude']
  })
  messageType: string;

  @Prop({
    required: true
  })
  bucketKey: string;

  @Prop({
    type: [Number],
    default: []
  })
  usedResponseIndices: number[];

  @Prop({
    default: 0
  })
  cycleCount: number;

  @Prop({
    type: Date,
    default: Date.now
  })
  lastUsedAt: Date;

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

export type MoodMessageHistoryDocument = HydratedDocument<MoodMessageHistory>;

export const MoodMessageHistorySchema = SchemaFactory.createForClass(MoodMessageHistory);

MoodMessageHistorySchema.index({ userId: 1, messageType: 1, bucketKey: 1 });
MoodMessageHistorySchema.index({ userId: 1, lastUsedAt: -1 });
