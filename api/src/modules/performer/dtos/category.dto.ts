import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';

export class PerformerCategoryDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  ordering: number;

  @Expose()
  description: string;

  @Expose()
  metaTitle: string;

  @Expose()
  metaDescription: string;

  @Expose()
  metaKeyword: string;

  @Expose()
  createdBy: ObjectId;

  @Expose()
  updatedBy: ObjectId;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(data?: Partial<PerformerCategoryDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'slug',
        'ordering',
        'description',
        'metaTitle',
        'metaDescription',
        'metaKeyword',
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  public toSearchResponse() {
    return pick(this, [
      '_id',
      'name',
      'slug',
      'ordering'
    ]);
  }

  public toPublicResponse() {
    return pick(this, [
      '_id',
      'name',
      'slug',
      'ordering',
      'description',
      'metaTitle',
      'metaDescription',
      'metaKeyword'
    ]);
  }
}
