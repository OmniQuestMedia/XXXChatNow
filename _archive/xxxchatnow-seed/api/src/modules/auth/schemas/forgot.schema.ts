import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'forgot'
})
export class Forgot {
  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  authId: MongooseSchema.Types.ObjectId;

  @Prop()
  source: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  sourceId: MongooseSchema.Types.ObjectId;

  @Prop()
  token: string;

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

export type ForgotDocument = HydratedDocument<Forgot>;

export const ForgotSchema = SchemaFactory.createForClass(Forgot);

ForgotSchema.index({ token: 1 }, {
  name: 'idx_token',
  unique: true
});

ForgotSchema.index({ sourceId: 1 }, {
  name: 'idx_sourceId'
});
