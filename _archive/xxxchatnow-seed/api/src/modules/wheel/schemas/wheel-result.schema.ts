import { ObjectId } from 'mongodb';
import { Schema } from 'mongoose';

export const WheelResultSchema = new Schema({
  performerId: ObjectId,
  streamId: ObjectId,
  streamSessionId: ObjectId,
  conversationId: ObjectId,
  creatorId: ObjectId,
  action: String,
  description: String,
  price: Number,
  status: {
    type: String,
    // enum: ['created', 'rejected', 'finished', 'accepted', 'refunded'],
    default: 'created'
  },
  chargeStatus: {
    type: Boolean,
    default: false
  },
  earnStatus: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
