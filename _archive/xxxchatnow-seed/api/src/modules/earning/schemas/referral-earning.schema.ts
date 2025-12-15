import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'referralEarnings'
})
export class ReferralEarning {
  @Prop({
    index: true
  })
  registerSource: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  registerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  referralSource: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  referralId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  earningId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop({
    default: 0
  })
  grossPrice: number;

  @Prop({
    default: 0
  })
  netPrice: number;

  @Prop({
    default: 0
  })
  referralCommission: number;

  @Prop({
    default: false,
    index: true
  })
  isPaid: boolean;

  @Prop()
  paidAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;

  @Prop({
    default: false
  })
  isToken: boolean;

  @Prop({
    default: 'success'
  })
  transactionStatus: string;

  @Prop({
    type: Date,
    default: Date.now
  })
  updatedAt: Date;
}

export type ReferralEarningDocument = HydratedDocument<ReferralEarning>;

export const ReferralEarningSchema = SchemaFactory.createForClass(ReferralEarning);
