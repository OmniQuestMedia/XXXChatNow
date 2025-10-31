import { Expose, Transform } from 'class-transformer';
import { pick } from 'lodash';
import { ObjectId } from 'mongoose';

export class TokenPackageDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  ordering: number;

  @Expose()
  price: number;

  @Expose()
  tokens: number;

  @Expose()
  isActive: boolean;

  @Expose()
  updatedAt: Date;

  @Expose()
  createdAt: Date;

  constructor(data: Partial<TokenPackageDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'description',
        'ordering',
        'price',
        'tokens',
        'isActive',
        'pi_code',
        'updatedAt',
        'createdAt'
      ])
    );
  }

  toResponse() {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      ordering: this.ordering,
      price: this.price,
      tokens: this.tokens,
      isActive: this.isActive,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt
    };
  }
}
