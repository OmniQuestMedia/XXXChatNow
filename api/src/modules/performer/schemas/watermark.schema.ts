import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'watermarksettings' // hoặc đổi thành 'watermarks' tùy theo collection bạn dùng
})
export class WatermarkSetting {
  @Prop({ type: Types.ObjectId, index: true })
  sourceId: Types.ObjectId;

  @Prop({ default: false })
  watermarkEnabled: boolean;

  @Prop({ default: false })
  watermarkStreamEnabled: boolean;

  @Prop({ default: 'image' })
  type: string;

  // Text settings
  @Prop()
  watermarkText?: string;

  @Prop()
  watermarkOpacity?: number;

  @Prop()
  watermarkColor?: string;

  @Prop()
  watermarkFontSize?: number;

  @Prop()
  watermarkTop?: number;

  @Prop()
  watermarkBottom?: number;

  @Prop()
  watermarkLeft?: number;

  @Prop()
  watermarkAlign?: string;

  // Image settings
  @Prop({ type: Types.ObjectId })
  watermarkImageId?: Types.ObjectId;
}

export type WatermarkSettingDocument = WatermarkSetting & Document;
export const WatermarkSettingSchema = SchemaFactory.createForClass(WatermarkSetting);
