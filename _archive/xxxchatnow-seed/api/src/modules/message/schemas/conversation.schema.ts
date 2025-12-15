import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema()
export class Recipient {
  @Prop()
  source: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;
}
const RecipientSchema = SchemaFactory.createForClass(Recipient);

@Schema({
  collection: 'conversations'
})
export class Conversation {
  @Prop()
  type: string;

  @Prop()
  name: string;

  @Prop()
  lastMessage: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  lastSenderId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  lastMessageCreatedAt: Date;

  @Prop({
    type: [{
      type: RecipientSchema,
      _id: false
    }]
  })
  recipients: Array<Recipient>;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  streamId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

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

export type ConversationDocument = HydratedDocument<Conversation>;

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ recipients: 1 });
ConversationSchema.index({ performerId: 1, type: 1 });
