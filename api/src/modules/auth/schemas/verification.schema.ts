import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'verifications'
})
export class Verification {
  @Prop()
  sourceType: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId
  })
  sourceId: MongooseSchema.Types.ObjectId;

  @Prop({
    default: 'email'
  })
  type: string;

  @Prop()
  value: string;

  @Prop()
  token: string;

  @Prop({
    default: false
  })
  verified: boolean;

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

export type VerificationDocument = HydratedDocument<Verification>;

export const VerificationSchema = SchemaFactory.createForClass(Verification);

VerificationSchema.index({ token: 1 }, {
  name: 'idx_token',
  unique: true,
  sparse: true
});

VerificationSchema.index({ sourceId: 1 }, {
  name: 'idx_sourceId'
});
