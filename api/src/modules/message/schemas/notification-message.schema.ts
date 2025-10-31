import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'notificationmessages'
})
export class NotificationMessage {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  conversationId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  recipientId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    default: 0
  })
  totalNotReadMessage: number;

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

export type NotificationMessageDocument = HydratedDocument<NotificationMessage>;

export const NotificationMessageSchema = SchemaFactory.createForClass(NotificationMessage);
