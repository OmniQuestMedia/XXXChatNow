import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'leaderboards'
})
export class LeaderBoard {
  @Prop({
    type: String,
    required: true
  })
  title: string;

  @Prop({
    type: String,
    default: 'last_week',
    enum: ['last_day', 'last_week', 'last_month', 'last_year']
  })
  duration: string;

  @Prop({
    type: String,
    required: true,
    enum: ['favorites', 'totalSpent', 'totalEarned']
  })
  type: string;

  @Prop({
    type: String,
    default: 'active'
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

export type LeaderBoardDocument = LeaderBoard & Document;

export const LeaderBoardSchema = SchemaFactory.createForClass(LeaderBoard);
