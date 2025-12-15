import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'orders'
})
export class Order {
  @Prop()
  orderNumber: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  buyerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  buyerSource: string; // user, performer...

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sellerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  sellerSource: string;

  @Prop()
  sellerUsername: string;

  @Prop()
  type: string; // physical , digital...

  @Prop()
  productType: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  productId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  unitPrice: number;

  @Prop()
  quantity: number;

  @Prop()
  originalPrice: number;

  @Prop()
  totalPrice: number;

  @Prop({
    index: true
  })
  status: string;

  @Prop({
    index: true
  })
  deliveryStatus: string;

  @Prop()
  deliveryAddress: string;

  @Prop()
  postalCode: string;

  @Prop({
    index: true
  })
  paymentStatus: string;

  @Prop()
  payBy: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  couponInfo: Record<string, any>;

  @Prop()
  shippingCode: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  extraInfo: Record<string, any>;

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

export type OrderDocument = HydratedDocument<Order>;

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ buyerId: 1, productId: 1, status: 1 });
