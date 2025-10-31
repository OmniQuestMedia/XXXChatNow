import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  collection: 'crowdfunding'
})
export class Crowdfunding {
  @Prop()
  title?: string;

  @Prop()
  descriptions?: string;

  @Prop()
  token?: number;

  @Prop()
  remainingToken?: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId?: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: [MongooseSchema.Types.ObjectId],
    default: [],
    index: true
  })
  contributes?: (ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId)[];

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt?: Date;
}

export type CrowdfundingDocument = HydratedDocument<Crowdfunding>;
export const CrowdfundingSchema = SchemaFactory.createForClass(Crowdfunding);

// Optional index
CrowdfundingSchema.index({ performerId: 1 });
