import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

/**
 * Message Context
 * Stores context information about the message interaction
 */
@Schema({
  _id: false
})
export class MessageContext {
  @Prop({
    enum: ['tip', 'gift', 'message', 'greeting', 'follow']
  })
  messageType: string;

  @Prop()
  amount?: number;
}

const MessageContextSchema = SchemaFactory.createForClass(MessageContext);

/**
 * UserMessageHistory Schema
 * Tracks usage of mood messaging responses (for analytics)
 * Note: Does NOT store message content for privacy
 */
@Schema({
  collection: 'usermessagehistory'
})
export class UserMessageHistory {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    ref: 'User'
  })
  userId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Performer'
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    ref: 'MoodBucket'
  })
  bucketId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    required: true
  })
  bucketName: string;

  @Prop({
    required: true
  })
  responseIndex: number;

  @Prop({
    type: MessageContextSchema
  })
  context: MessageContext;

  @Prop({
    type: Date,
    default: Date.now,
    index: true
  })
  timestamp: Date;
}

export type UserMessageHistoryDocument = HydratedDocument<UserMessageHistory>;

export const UserMessageHistorySchema = SchemaFactory.createForClass(UserMessageHistory);

// Compound indexes for analytics queries
UserMessageHistorySchema.index({ performerId: 1, timestamp: -1 });
UserMessageHistorySchema.index({ userId: 1, timestamp: -1 });
UserMessageHistorySchema.index({ bucketId: 1, timestamp: -1 });
