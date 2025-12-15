import { Document } from "mongoose";
import {ObjectId} from 'mongodb';


export class StreamGoalModel extends Document {
  streamId: ObjectId;

  performerId: ObjectId;

  description: string;

  remainToken: number;

  goals: any;

  createdAt: Date;

  updatedAt: Date;
}