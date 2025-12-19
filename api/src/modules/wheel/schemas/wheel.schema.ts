import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';

export const WheelSchema = new Schema({
  performerId: ObjectId,
  name: { type: String },
  description: { type: String },
  color: { 
    type: String,
    default: '#9e16e1'
  },
  time: { type: Number, default: 0 }, // in minute
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  ordering: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
