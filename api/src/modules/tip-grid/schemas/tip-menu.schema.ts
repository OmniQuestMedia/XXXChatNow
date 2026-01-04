import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'tipmenus'
})
export class TipMenu {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Performer',
    index: true,
    required: true,
    unique: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    required: true
  })
  title: string;

  @Prop({
    default: ''
  })
  description: string;

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

export type TipMenuDocument = HydratedDocument<TipMenu>;

export const TipMenuSchema = SchemaFactory.createForClass(TipMenu);

TipMenuSchema.index({ performerId: 1, isActive: 1 });
