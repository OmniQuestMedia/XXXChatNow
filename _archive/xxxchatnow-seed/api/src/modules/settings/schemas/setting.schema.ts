import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';

@Schema({
  collection: 'settings'
})
export class Setting {
  @Prop({
    type: String, required: true, index: true
  })
  key: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  value: any;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({
    default: 'system'
  })
  group: string;

  @Prop({
    default: false
  })
  public: boolean;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  extra: any;

  @Prop({
    default: 'text'
  })
  type: string;

  @Prop({
    default: true
  })
  visible: boolean;

  @Prop({
    default: true
  })
  editable: boolean;

  @Prop({
    default: true
  })
  autoload: boolean;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  meta: Record<string, any>;

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

export type SettingDocument = HydratedDocument<Setting>;

export const SettingSchema = SchemaFactory.createForClass(Setting);
