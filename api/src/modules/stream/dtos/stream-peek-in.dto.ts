import { Exclude, Expose, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class StreamPeekIn {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Exclude()
  @Transform(({ obj }) => obj.streamId)
  streamId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.userId)
  userId: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.performerId)
  performerId: ObjectId;

  @Expose()
  performerInfo: any;

  @Expose()
  streamType: string;

  @Expose()
  token: number;

  @Expose()
  timeLimit: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
