import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  _id: false
})
export class ProductInfo {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  productType: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  productId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  quantity: number;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  extraInfo: Record<string, any>;
}
const ProductInfoSchema = SchemaFactory.createForClass(ProductInfo);

@Schema({
  collection: 'paymenttransactions'
})
export class PaymentTransaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  orderId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  paymentGateway: string;

  @Prop()
  buyerSource: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  buyerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    index: true
  })
  type: string;

  @Prop({
    type: [{
      type: ProductInfoSchema,
      _id: false
    }]
  })
  products: Array<ProductInfo>;

  @Prop({
    default: 0
  })
  totalPrice: number;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  paymentResponseInfo: Record<string, any>;

  // pending, success, etc...
  @Prop({
    index: true
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

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);

PaymentTransactionSchema.index({ buyerId: 1, productId: 1, status: 1 });
PaymentTransactionSchema.index({
  buyerId: 1,
  status: 1
});
