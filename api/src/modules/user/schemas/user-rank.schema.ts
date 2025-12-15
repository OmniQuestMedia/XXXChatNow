import * as mongoose from 'mongoose';

export const UserRankSchema = new mongoose.Schema({
  userId: {
    type: String
  },
  userPoint: Number,
  performerId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
