import { Schema } from 'mongoose';

export const IPCountrySchema = new Schema({
  ip: {
    type: String,
    index: true,
    unique: true
  },
  country: String,
  info: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
