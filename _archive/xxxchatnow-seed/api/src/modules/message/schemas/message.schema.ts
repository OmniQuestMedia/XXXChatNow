import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'messages'
})
export class Message {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  conversationId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  // text, file, etc...
  @Prop({
    index: true,
    default: 'text'
  })
  type: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  fileId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  text: string;

  @Prop()
  senderSource: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  senderId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  meta: Record<string, any>;

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

export type MessageDocument = HydratedDocument<Message>;

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
