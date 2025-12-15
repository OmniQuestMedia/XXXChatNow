import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export class AuthDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id?: ObjectId | MongooseObjectId | string;

  @Expose()
  source: string;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: string | ObjectId | MongooseObjectId;

  @Expose()
  type: string;

  @Expose()
  key: string;

  @Expose()
  value: string;

  @Expose()
  salt: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
