import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'earnings' })
export class Earning {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Performer' })
  performerId: MongooseSchema.Types.ObjectId;

  @Prop()
  grossPrice: number;

  @Prop()
  netPrice: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export type EarningDocument = Earning & Document;

export const EarningSchema = SchemaFactory.createForClass(Earning);
