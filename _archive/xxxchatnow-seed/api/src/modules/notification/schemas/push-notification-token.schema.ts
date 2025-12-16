// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, ObjectId } from 'mongoose';

@Schema({
  collection: 'pushnotificationtoken'
})
export class PushNotificationToken {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    index: true
  })
  userId: ObjectId;

  @Prop()
  userType: string;

  @Prop()
  userAgent: string;

  @Prop()
  registrationToken: string;

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

export type PushNotificationTokenDocument = HydratedDocument<PushNotificationToken>;
export const PushNotificationTokenSchema = SchemaFactory.createForClass(PushNotificationToken);
