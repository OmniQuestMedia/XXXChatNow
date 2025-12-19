import { Document } from 'mongoose';

export class UserRankModel extends Document {
 
  userId: string;

  performerId: string;

  userPoint: number;

  createdAt: Date;

  updatedAt: Date;
}
