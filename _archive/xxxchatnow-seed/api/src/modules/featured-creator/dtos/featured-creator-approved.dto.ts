import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { Expose, Transform } from 'class-transformer';

export class FeaturedCreatorApprovedDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.packageId)
  packageId?: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId?: ObjectId;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  updatedAt?: Date;

  @Expose()
  createdAt?: Date;

  @Expose()
  status: string;

  constructor(data: Partial<FeaturedCreatorApprovedDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'packageId',
        'performerId',
        'startDate',
        'endDate',
        'updatedAt',
        'createdAt',
        'status'
      ])
    );
  }

  public toResponse() {
    return {
      _id: this._id,
      packageId: this.packageId,
      performerId: this.performerId,
      startDate: this.startDate,
      endDate: this.endDate,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}
