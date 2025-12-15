import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';

@Schema({
  collection: 'refundrequests'
})
export class RefundRequest {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  userId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    default: 'product',
    index: true
  })
  sourceType: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    default: 0
  })
  token: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  description: string;

  @Prop({
    index: true,
    enum: ['pending', 'resolved', 'rejected'],
    default: 'pending'
  })
  status: string;

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

export type RefundRequestDocument = HydratedDocument<RefundRequest>;

export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);
