import { pick } from 'lodash';
import { UserDto } from 'src/modules/user/dtos';
import { Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { ObjectId as MongooseObjectId } from 'mongoose';

export class PostDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId | MongooseObjectId | string;

  @Expose()
  @Transform(({ obj }) => obj.authorId)
  authorId: ObjectId | MongooseObjectId | string;

  @Expose()
  author: Partial<UserDto>;

  @Expose()
  type: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  content: string;

  @Expose()
  shortDescription: string;

  @Expose()
  @Transform(({ obj }) => obj.categoryIds)
  categoryIds: string[];

  @Expose()
  status: string;

  @Expose()
  meta: any[];

  @Expose()
  image: any;

  @Expose()
  metaTitle: string;

  @Expose()
  metaDescription: string;

  @Expose()
  metaKeyword: string;

  @Expose()
  canonicalUrl: string;

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

  constructor(data: Partial<PostDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'authorId',
        'type',
        'title',
        'slug',
        'content',
        'shortDescription',
        'categoryIds',
        'status',
        'meta',
        'image',
        'metaTitle',
        'metaDescription',
        'metaKeyword',
        'canonicalUrl',
        'updatedBy',
        'createdBy',
        'createdAt',
        'updatedAt'
      ])
    );
  }
}
