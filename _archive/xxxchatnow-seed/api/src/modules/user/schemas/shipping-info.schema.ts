import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'shippinginfousers'
})
export class ShippingInfo {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  userId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  deliveryAddress: string;

  @Prop()
  postalCode: string;

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

export type ShippingInfoDocument = HydratedDocument<ShippingInfo>;

export const ShippingInfoSchema = SchemaFactory.createForClass(ShippingInfo);

ShippingInfoSchema.index({
  userId: 1
}, {
  name: 'idx_userId'
});
