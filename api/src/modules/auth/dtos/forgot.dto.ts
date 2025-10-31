import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export class ForgotDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id?: ObjectId | MongooseObjectId | string;

  @Expose()
  @Transform(({ obj }) => obj.authId)
  authId: ObjectId | MongooseObjectId | string;

  @Expose()
  source: string;

  @Expose()
  @Transform(({ obj }) => obj.sourceId)
  sourceId: string | ObjectId | MongooseObjectId;

  @Expose()
  token: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
