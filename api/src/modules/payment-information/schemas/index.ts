import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

import { BANKING_SOURCE } from '../constants';

@Schema({
  collection: 'paymentinformations',
  strict: false
})
export class PaymentInformation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    default: BANKING_SOURCE.PERFORMER
  })
  sourceType: string;

  @Prop()
  type: string;

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

export type PaymentInformationDocument = HydratedDocument<PaymentInformation>;

export const PaymentInformationSchema = SchemaFactory.createForClass(PaymentInformation);

PaymentInformationSchema.index({ sourceId: 1, type: 1 });
