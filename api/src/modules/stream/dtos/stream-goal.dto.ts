import { ObjectId } from 'mongodb';
import { Expose, plainToInstance, Transform } from 'class-transformer';
import { pick } from 'lodash';

export interface Goal {
  id: number;
  name: string;
  token: number;
  ordering: number;
}

export class StreamGoalDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.streamId)
  streamId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  description: string;

  @Expose()
  remainToken: number;

  @Expose()
  goals: Goal[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(options: Partial<StreamGoalDto>) {
    Object.assign(
      this,
      pick(options, [
        '_id',
        'streamId',
        'performerId',
        'description',
        'remainToken',
        'goals',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  public toResponse() {
    return {
      _id: this._id,
      streamId: this.streamId,
      performerId: this.performerId,
      description: this.description,
      remainToken: this.remainToken,
      goals: this.goals,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  public static fromModel(model) {
    if (!model) return null;

    return plainToInstance(StreamGoalDto, model.toObject());
  }
}
