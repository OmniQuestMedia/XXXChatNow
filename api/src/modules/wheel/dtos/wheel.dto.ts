import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class WheelDto {
  _id?: ObjectId;

  performerId: ObjectId;

  name?: string;

  description?: string;

  time?: number;

  status?: string;

  color?: string;

  ordering?: number;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(data?: Partial<WheelDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'performerId',
        'name',
        'description',
        'time',
        'color',
        'status',
        'ordering',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse() {
    return {
      _id: this._id,
      performerId: this.performerId,
      name: this.name,
      description: this.description,
      time: this.time,
      status: this.status,
      color: this.color,
      ordering: this.ordering,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt
    };
  }
}
