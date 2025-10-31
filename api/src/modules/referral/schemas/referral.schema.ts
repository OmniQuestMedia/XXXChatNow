import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'referrals'
})
export class ReferralUser {
  @Prop({
    default: 'performer'
  })
  registerSource: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  registerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    default: 'performer'
  })
  referralSource: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  referralId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;
}

export type ReferralUserDocument = HydratedDocument<ReferralUser>;
export const ReferralUserSchema = SchemaFactory.createForClass(ReferralUser);

@Schema({
  collection: 'referralCodes'
})
export class ReferralCode {
  @Prop({
    default: 'user'
  })
  source: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true,
    unique: true,
    trim: true,
    sparse: true
  })
  code: string;

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

export type ReferralCodeDocument = HydratedDocument<ReferralCode>;
export const ReferralCodeSchema = SchemaFactory.createForClass(ReferralCode);
