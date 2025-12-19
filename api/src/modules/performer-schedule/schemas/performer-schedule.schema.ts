import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'performerschedule'
})
export class PerformerSchedule {
  @Prop()
  title: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop()
  description: string;

  @Prop({
    default: false
  })
  isPrivate: boolean;

  @Prop()
  price: number;

  @Prop({
    index: true
  })
  status: string;

  @Prop({
    type: Date,
    default: Date.now
  })
  startAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  endAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  updatedAt: Date;
}

export type PerformerScheduleDocument = HydratedDocument<PerformerSchedule>;

export const PerformerScheduleSchema = SchemaFactory.createForClass(PerformerSchedule);

PerformerScheduleSchema.index({
  performerId: 1,
  status: 1
});
