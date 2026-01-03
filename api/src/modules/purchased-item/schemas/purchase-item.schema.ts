import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'purchaseditems'
})
export class PurchasedItem {
  @Prop()
  source: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sourceId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  target: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  targetId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  // item owner
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  sellerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  quantity: number;

  @Prop({
    index: true
  })
  type: string;

  @Prop({
    default: 0
  })
  totalPrice: number;

  @Prop({
    default: 0
  })
  originalPrice: number;

  // pending, success, etc...
  @Prop({
    index: true
  })
  status: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  extraInfo: Record<string, any>;

  // RRR (RedRoomRewards) ledger tracking fields
  @Prop()
  rrrLedgerEntryId: string;

  @Prop()
  rrrSourceRef: string;

  @Prop({
    type: Date
  })
  rrrPostedAt: Date;

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

export type PurchasedItemDocument = HydratedDocument<PurchasedItem>;

export const PurchasedItemSchema = SchemaFactory.createForClass(PurchasedItem);

PurchasedItemSchema.index({
  sourceId: 1,
  targetId: 1,
  status: 1
});
