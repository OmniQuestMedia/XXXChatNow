import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'payoutrequests'
})
export class PayoutRequest {
  @Prop()
  source: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  studioRequestId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  studioId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    enum: ['wire', 'paypal', 'issue_check_us', 'deposit', 'payoneer', 'bitpay'],
    index: true
  })
  paymentAccountType: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  paymentAccountInfo: any;

  @Prop()
  fromDate: Date;

  @Prop()
  toDate: Date;

  @Prop()
  requestNote: string;

  @Prop()
  adminNote: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected', 'done'],
    default: 'pending',
    index: true
  })
  status: string;

  @Prop({
    type: String,
    enum: ['performer', 'studio'],
    index: true
  })
  sourceType: string;

  @Prop({
    default: 0
  })
  tokenMustPay: number;

  @Prop({
    default: 0
  })
  previousPaidOut: number;

  @Prop({
    default: 0
  })
  pendingToken: number;

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

  @Prop()
  conversionRate: number;
}

export type PayoutRequestDocument = HydratedDocument<PayoutRequest>;

export const PayoutRequestSchema = SchemaFactory.createForClass(PayoutRequest);

PayoutRequestSchema.index({
  sourceId: 1,
  status: 1,
  createdAt: 1
});
