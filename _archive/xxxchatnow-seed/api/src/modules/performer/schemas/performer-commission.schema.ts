import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performercommissions'
})
export class PerformerCommission {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId;

  @Prop({
    default: 0
  })
  studioCommission: number;

  @Prop({
    default: 0
  })
  memberCommission: number;

  @Prop({
    default: 50
  })
  tipCommission: number;

  @Prop({
    default: 50
  })
  privateCallCommission: number;

  @Prop({
    default: 50
  })
  groupCallCommission: number;

  @Prop({
    default: 50
  })
  productCommission: number;

  @Prop({
    default: 50
  })
  albumCommission: number;

  @Prop({
    default: 50
  })
  videoCommission: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  createdBy: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  updatedBy: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

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

  @Prop({
    default: 50
  })
  spinWheelCommission: number;
}

export type PerformerCommissionDocument = HydratedDocument<PerformerCommission>;

export const PerformerCommissionSchema = SchemaFactory.createForClass(PerformerCommission);
