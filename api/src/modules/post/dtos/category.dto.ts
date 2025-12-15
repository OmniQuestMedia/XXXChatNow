import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export class CategoryDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId | MongooseObjectId | string;

  @Expose()
  @Transform(({ obj }) => obj.parentId)
  parentId: ObjectId | MongooseObjectId | string;

  @Expose()
  type: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  description: string;

  @Expose()
  @Transform(({ obj }) => obj.updatedBy)
  updatedBy: ObjectId | MongooseObjectId | string;

  @Expose()
  @Transform(({ obj }) => obj.createdBy)
  createdBy: ObjectId | MongooseObjectId | string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data: Partial<CategoryDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'parentId',
        'type',
        'title',
        'slug',
        'description',
        'updatedBy',
        'createdBy',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}
