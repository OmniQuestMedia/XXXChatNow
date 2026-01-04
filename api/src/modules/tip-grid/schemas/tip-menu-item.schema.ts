import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'tipmenuitems'
})
export class TipMenuItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'TipMenu',
    index: true,
    required: true
  })
  tipMenuId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Performer',
    index: true,
    required: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    required: true
  })
  label: string;

  @Prop({
    required: true,
    min: 0
  })
  price: number;

  @Prop({
    default: ''
  })
  description: string;

  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  position: number;

  @Prop({
    type: Boolean,
    default: true
  })
  isActive: boolean;

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

export type TipMenuItemDocument = HydratedDocument<TipMenuItem>;

export const TipMenuItemSchema = SchemaFactory.createForClass(TipMenuItem);

TipMenuItemSchema.index({ tipMenuId: 1, position: 1 });
TipMenuItemSchema.index({ performerId: 1, isActive: 1 });
