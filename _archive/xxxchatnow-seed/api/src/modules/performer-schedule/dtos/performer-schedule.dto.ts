import { Expose, Transform } from 'class-transformer';
import { pick } from 'lodash';
import { ObjectId } from 'mongodb';
import { PerformerDto } from 'src/modules/performer/dtos';

export class PerformerScheduleDto {
    @Expose()
    @Transform(({ obj }) => obj._id)
    _id: ObjectId;

    @Expose()
    @Transform(({ obj }) => obj.performerId)
    performerId: ObjectId;

    @Expose()
    @Transform(({ obj }) => obj.performer)
    performer: PerformerDto;

    @Expose()
    title: string;

    @Expose()
    isPrivate: boolean;

    @Expose()
    price: number;

    @Expose()
    description: string;

    @Expose()
    status: string;

    @Expose()
    startAt: Date;

    @Expose()
    endAt: Date;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    constructor(init?: Partial<PerformerScheduleDto>) {
      Object.assign(this, pick(init, [
        '_id',
        'performerId',
        'performer',
        'title',
        'price',
        'description',
        'status',
        'isPrivate',
        'startAt',
        'endAt',
        'createdAt',
        'updatedAt'
      ]));
    }
}
