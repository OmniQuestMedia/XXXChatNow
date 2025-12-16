import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

export class WheelModel extends Document {
  performerId: ObjectId;

  name: string;

  description: string;

  time: number;

  status: string;

  ordering: number;

  createdAt: Date;

  updatedAt: Date;

  color: string;
}
