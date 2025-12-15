import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

import { STATUES } from 'src/modules/payout-request/constants';

@Schema({
  _id: false
})
export class StudioToModel {
  @Prop()
  grossPrice: number;

  @Prop()
  commission: number;

  @Prop()
  netPrice: number;

  @Prop()
  payoutStatus: string;

  @Prop({
    index: true,
    type: MongooseSchema.Types.ObjectId
  })
  refItemId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;
}
const StudioToModelSchema = SchemaFactory.createForClass(StudioToModel);

@Schema({
  collection: 'earnings'
})
export class Earning {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  transactionTokenId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  userId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  targetId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop()
  source: string;

  @Prop()
  target: string;

  @Prop({
    default: 0
  })
  originalPrice: number;

  @Prop({
    default: 0
  })
  grossPrice: number;

  @Prop({
    default: 0
  })
  netPrice: number;

  @Prop()
  commission: number;

  @Prop({
    default: false,
    index: true
  })
  isPaid: boolean;

  @Prop({
    index: true
  })
  transactionStatus: string;

  // custom field for studio report
  @Prop({
    default: STATUES.PENDING
  })
  payoutStatus: string;

  // use in case studio to model
  @Prop({
    type: StudioToModelSchema
  })
  studioToModel: StudioToModel;

  @Prop()
  paidAt: Date;

  @Prop({
    default: 1
  })
  conversionRate: number;

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

export type EarningDocument = HydratedDocument<Earning>;

export const EarningSchema = SchemaFactory.createForClass(Earning);
