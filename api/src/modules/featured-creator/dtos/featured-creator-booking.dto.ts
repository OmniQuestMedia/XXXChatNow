import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';

export interface IFeaturedCreatorBooking {
  _id: ObjectId;
  name: string;
  price: number;
  description: string;
  packageId?: ObjectId;
  performerId?: ObjectId;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  updatedAt?: Date;
  createdAt?: Date;
}

export class FeaturedCreatorBookingDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  name?: string;

  @Expose()
  price?: number;

  @Expose()
  description?: string;

  @Expose()
  @Transform(({ obj }) => obj.packageId)
  packageId?: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId?: ObjectId;

  @Expose()
  status?: string;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  createdAt?: Date;

  constructor(data: Partial<IFeaturedCreatorBooking>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'name',
        'price',
        'description',
        'packageId',
        'performerId',
        'status',
        'startDate',
        'endDate',
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
      packageId: this.packageId,
      performerId: this.performerId,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt
    };
  }
}
