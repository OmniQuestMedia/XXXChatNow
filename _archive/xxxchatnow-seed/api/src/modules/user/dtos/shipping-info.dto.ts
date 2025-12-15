import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export class ShippingInfoDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId | MongooseObjectId | string;

  @Expose()
  @Transform(({ obj }) => obj.userId)
  userId: ObjectId | MongooseObjectId | string;

  @Expose()
  deliveryAddress: string;

  @Expose()
  postalCode: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
