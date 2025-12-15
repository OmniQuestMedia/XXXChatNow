import { Document } from 'mongoose';

export class CurrencyConversionModel extends Document {
  from: string;

  to: string;

  rate: number;

  createdAt: Date;

  updatedAt: Date;
}
