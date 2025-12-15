import { ObjectId } from 'mongodb';
import { Expose, Transform } from 'class-transformer';

export class FeaturedCreatorStatusDto {
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

  constructor(data: Partial<FeaturedCreatorStatusDto>) {
    Object.assign(this, data);
  }

  public toResponse() {
    return {
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
