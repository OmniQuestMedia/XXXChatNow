import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performerblocksettings'
})
export class BlockSetting {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true,
    unique: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{
      type: String,
      index: true
    }]
  })
  countries: string[];

  @Prop({
    type: [{
      type: MongooseSchema.Types.ObjectId,
      index: true
    }]
  })
  userIds: Array<ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId>;

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

export type BlockSettingDocument = HydratedDocument<BlockSetting>;

export const BlockSettingSchema = SchemaFactory.createForClass(BlockSetting);
