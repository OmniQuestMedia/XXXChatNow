import { ObjectId } from 'mongodb';

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';
import { STATUS_ACTIVE, ROLE_USER } from '../constants';

@Schema({
  _id: false
})
export class UserStats {
  @Prop({
    default: 0
  })
  totalViewTime: number;

  @Prop({
    default: 0
  })
  totalTokenEarned: number;

  @Prop({
    default: 0
  })
  totalTokenSpent: number;
}
const UserStatsSchema = SchemaFactory.createForClass(UserStats);

@Schema({
  collection: 'users'
})
export class User {
  @Prop()
  name: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

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
  phone: string;

  @Prop({
    type: [
      {
        type: String,
        default: ROLE_USER
      }
    ]
  })
  roles: string[];

  @Prop({
    default: false
  })
  emailVerified: boolean;

  @Prop({
    default: false
  })
  isDark: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  avatarId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  avatarPath: string;

  @Prop({
    default: STATUS_ACTIVE
  })
  status: string;

  @Prop()
  gender: string;

  @Prop({
    default: 0
  })
  balance: number;

  @Prop()
  country: string;

  @Prop()
  timezone: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({
    default: false
  })
  isOnline: boolean;

  @Prop({
    default: false
  })
  enableGhostMode: boolean;

  @Prop()
  onlineAt: Date;

  @Prop()
  offlineAt: Date;

  @Prop({
    default: 0
  })
  totalOnlineTime: number;

  @Prop({
    default: 0
  })
  badgingColor: string;

  @Prop({
    type: UserStatsSchema,
    default: {
      totalViewTime: 0,
      totalTokenEarned: 0,
      totalTokenSpent: 0
    }
  })
  stats: UserStats;

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
  twoFactorAuthenticationSecret: string;

  @Prop({
    default: false
  })
  isTwoFactorAuthenticationEnabled: boolean;

  @Prop({
    type: String,
    default: 'USD'
  })
  currency: string;

  @Prop({
    default: false
  })
  twoFactorAuthenticationEnabled: boolean;

  @Prop({
    default: false
  })
  isPrivacy: boolean;

  @Prop({
    default: false
  })
  walletVerified: boolean;

  @Prop()
  walletVerifiedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({
  status: 1
}, {
  name: 'idx_status'
});
