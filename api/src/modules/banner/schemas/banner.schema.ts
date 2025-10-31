import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'banners'
})
export class Banner {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  fileId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  href: string;

  @Prop()
  status: string;

  @Prop()
  description: string;

  @Prop()
  position: string;

  @Prop()
  type: string;

  @Prop()
  contentHTML: string;

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

export type BannerDocument = HydratedDocument<Banner>;

export const BannerSchema = SchemaFactory.createForClass(Banner);
BannerSchema.index({ position: 1 }, {
  name: 'idx_position'
});
