import { ObjectId } from 'mongodb';
import { pick } from 'lodash';

export class WheelResultDto {
  _id?: ObjectId;

  performerId: ObjectId;

  streamId: ObjectId;

  conversationId: ObjectId;

  streamSessionId: ObjectId;

  creatorId: ObjectId;

  action: string;

  description: string;

  price: number;

  status: string; // created / accepted / refunded

  chargeStatus: boolean; // if status is accepted => yes, else => no

  earnStatus: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  constructor(data?: Partial<WheelResultDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'performerId',
        'streamId',
        'streamSessionId',
        'conversationId',
        'creatorId',
        'action',
        'description',
        'price',
        'status',
        'chargeStatus',
        'earnStatus',
        'createdAt',
        'updatedAt'
      ])
    );
  }

  toResponse() {
    return {
      _id: this._id,
      performerId: this.performerId,
      streamId: this.streamId,
      streamSessionId: this.streamSessionId,
      conversationId: this.conversationId,
      creatorId: this.creatorId,
      action: this.action,
      description: this.description,
      price: this.price,
      status: this.status,
      chargeStatus: this.chargeStatus,
      earnStatus: this.earnStatus,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt
    };
  }
}
