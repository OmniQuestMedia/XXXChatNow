import { Schema } from 'mongoose';

export const CurrencyConversionSchema = new Schema({
  from: String,
  to: String,
  rate: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
