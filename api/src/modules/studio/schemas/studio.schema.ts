import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { IsTimeZone } from 'class-validator';

@Schema({
  _id: false
})
export class StudioStats {
  @Prop({
    default: 0
  })
  totalPerformer: number;

  @Prop({
    default: 0
  })
  totalHoursOnline: number;

  @Prop({
    default: 0
  })
  totalTokenEarned: number;

  @Prop({
    default: 0
  })
  totalTokenSpent: number;
}
const StudioStatsSchema = SchemaFactory.createForClass(StudioStats);
@Schema({
  collection: 'studios'
})
export class Studio {
  @Prop()
  name: string;

  @Prop({
    index: true,
    lowercase: true,
    unique: true,
    trim: true,
    // uniq if not null
    sparse: true
  })
  username: string;

  @Prop({
    index: true,
    unique: true,
    lowercase: true,
    trim: true,
    // uniq if not null
    sparse: true
  })
  email: string;

  @Prop()
  status: string;

  @Prop()
  phone: string;

  @Prop()
  country: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  zipcode: string;

  @Prop()
  address: string;

  @Prop({
    type: [{
      type: String,
      index: true
    }]
  })
  languages: string[];

  @Prop()
  @IsTimeZone()
  timezone: string;

  @Prop({
    default: 0
  })
  balance: number;

  @Prop({
    default: false
  })
  emailVerified: boolean;

  @Prop({
    type: [{
      type: String,
      default: 'studio'
    }]
  })
  roles: string[];

  @Prop({
    type: StudioStatsSchema,
    default: {
      totalPerformer: 0,
      totalHoursOnline: 0,
      totalTokenEarned: 0,
      totalTokenSpent: 0
    }
  })
  stats: StudioStats;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  documentVerificationId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  // TODO - should be removed
  @Prop()
  commission: number;
  // details for commission details

  @Prop()
  tipCommission: number;

  @Prop()
  privateCallCommission: number;

  @Prop()
  groupCallCommission: number;

  @Prop()
  productCommission: number;

  @Prop()
  albumCommission: number;

  @Prop()
  videoCommission: number;

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

  @Prop()
  spinWheelCommission: number;
}

export type StudioDocument = HydratedDocument<Studio>;

export const StudioSchema = SchemaFactory.createForClass(Studio);

StudioSchema.index({
  status: 1
}, {
  name: 'idx_status'
});
