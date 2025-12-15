import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class WheelResultModel extends Document {
  performerId: ObjectId;

  streamId: ObjectId;

  streamSessionId: ObjectId;

  conversationId: ObjectId;

  creatorId: ObjectId;

  action: string;

  description: string;

  price: number;

  status: string;

  chargeStatus: boolean;

  earnStatus: boolean;

  createdAt: Date;

  updatedAt: Date;
}
