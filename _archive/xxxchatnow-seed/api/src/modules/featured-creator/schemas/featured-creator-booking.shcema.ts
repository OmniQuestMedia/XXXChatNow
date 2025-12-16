import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema, ObjectId as MongooseObjectId } from 'mongoose';

@Schema({
  collection: 'featured_creator_bookings'
})
export class FeaturedCreatorBooking {
  @Prop({ type: String })
  name: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, index: true })
  packageId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, index: true })
  performerId: ObjectId | MongooseObjectId | MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, index: true })
  startDate: Date;

  @Prop({ type: Date, index: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: string;

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

export type FeaturedCreatorBookingDocument = HydratedDocument<FeaturedCreatorBooking>;

export const FeaturedCreatorBookingSchema = SchemaFactory.createForClass(FeaturedCreatorBooking);
