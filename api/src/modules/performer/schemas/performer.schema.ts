import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  _id: false
})
export class PerformerStats {
  @Prop({
    default: 0
  })
  views: number;

  @Prop({
    default: 0
  })
  favorites: number;

  @Prop({
    default: 0
  })
  totalVideos: number;

  @Prop({
    default: 0
  })
  spinWheelPrice: number;

  @Prop({
    default: 0
  })
  totalPhotos: number;

  @Prop({
    default: 0
  })
  totalGalleries: number;

  @Prop({
    default: 0
  })
  totalProducts: number;

  @Prop({
    default: 0
  })
  totalStreamTime: number;

  @Prop({
    default: 0
  })
  totalTokenEarned: number;

  @Prop({
    default: 0
  })
  totalTokenSpent: number;
}
const PerformerStatsSchema = SchemaFactory.createForClass(PerformerStats);

@Schema({
  collection: 'performers'
})
export class Performer {
  @Prop({
    default: false
  })
  isDark: boolean;

  @Prop()
  name: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

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
  phoneCode: string; // international code prefix

  @Prop()
  phone: string;

  @Prop()
  status: string;

  @Prop({
    default: false
  })
  verified: boolean;

  @Prop({
    default: false
  })
  emailVerified: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  avatarId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  avatarPath: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  idVerificationId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  documentVerificationId:
    | ObjectId
    | MongooseObjectId
    | MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  releaseFormId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: [
      {
        type: String,
        index: true
      }
    ]
  })
  tags: string[];

  @Prop()
  gender: string;

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
    type: [
      {
        type: String
      }
    ]
  })
  languages: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  studioId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({
    type: [
      {
        type: MongooseSchema.Types.ObjectId,
        index: true
      }
    ]
  })
  categoryIds: Array<
    ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId
  >;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  schedule: any;

  @Prop()
  timezone: string;

  @Prop()
  noteForPerformer: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  eyes: string;

  @Prop()
  height: string;

  @Prop()
  weight: string;

  @Prop()
  bio: string;

  @Prop()
  sexualReference: string;

  @Prop()
  hair: string;

  @Prop()
  pubicHair: string;

  @Prop()
  ethnicity: string;

  @Prop()
  aboutMe: string;

  @Prop()
  bust: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  socials: any;

  @Prop({
    default: false
  })
  isOnline: boolean;

  @Prop()
  onlineAt: Date;

  @Prop()
  offlineAt: Date;

  @Prop({
    default: false
  })
  live: boolean;

  @Prop({
    default: false
  })
  isPrivacy: boolean;

  @Prop()
  streamingStatus: string;

  @Prop()
  streamingTitle: string;

  @Prop({
    default: 0
  })
  balance: number;

  @Prop()
  maxParticipantsAllowed: number;

  @Prop()
  privateCallPrice: number;

  @Prop()
  groupCallPrice: number;

  @Prop()
  lastStreamingTime: Date;

  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop()
  metaKeyword: string;

  @Prop({
    type: PerformerStatsSchema,
    default: {
      views: 0,
      favorites: 0,
      totalVideos: 0,
      totalPhotos: 0,
      totalGalleries: 0,
      totalProducts: 0,
      totalStreamTime: 0,
      totalTokenEarned: 0,
      totalTokenSpent: 0
    }
  })
  stats: PerformerStats;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  createdBy: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

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

  @Prop({
    default: false
  })
  twoFactorAuthenticationEnabled: boolean;

  @Prop({
    default: 0
  })
  spinWheelPrice: number;

  @Prop({
    default: 0
  })
  peekInTimeLimit: number;

  @Prop({
    default: 0
  })
  peekInPrice: number;

  @Prop({
    default: false
  })
  enablePeekIn: boolean;

  @Prop({
    default: 0
  })
  badgingTierToken: number;
}

export type PerformerDocument = HydratedDocument<Performer>;

export const PerformerSchema = SchemaFactory.createForClass(Performer);
