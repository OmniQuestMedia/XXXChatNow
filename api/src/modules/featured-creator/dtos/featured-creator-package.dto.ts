import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';

export interface IFeaturedCreatorPackage {
  _id: ObjectId;
  name: string;
  price: number;
  description: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
}

export class FeaturedCreatorPackageDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  updatedAt: Date;

  @Expose()
  createdAt: Date;

  constructor(data: Partial<IFeaturedCreatorPackage>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'price',
        'description',
        'status',
        'updatedAt',
        'createdAt'
      ])
    );
  }

  public toResponse() {
    return {
      _id: this._id,
      name: this.name,
      price: this.price,
      description: this.description,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt
    };
  }
}
