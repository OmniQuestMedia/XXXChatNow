import { Document } from 'mongoose';

export class IPCountryModel extends Document {
  ip: string;

  country: string;

  info: any;

  createdAt: Date;

  updatedAt: Date;
}
