import { ObjectId } from 'mongodb';

export interface StreamGoalResponse {
  _id: ObjectId;

  streamId: ObjectId;

  performerId: ObjectId;

  description: string;

  remainToken: number;

  goals: any;

  createdAt: Date;

  updatedAt: Date;
}
