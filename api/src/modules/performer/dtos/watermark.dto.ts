import { Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';

export class WatermarkSettingDto {
  @Expose()
  sourceId: ObjectId;

  @Expose()
  watermarkEnabled: boolean;

  @Expose()
  watermarkStreamEnabled: boolean;

  @Expose()
  type: string;

  // Text
  @Expose()
  watermarkText: string;

  @Expose()
  watermarkOpacity: number;

  @Expose()
  watermarkColor: string;

  @Expose()
  watermarkFontSize: number;

  @Expose()
  watermarkTop: number;

  @Expose()
  watermarkBottom: number;

  @Expose()
  watermarkLeft: number;

  @Expose()
  watermarkAlign: string;

  // Image
  @Expose()
  watermarkImageId: ObjectId;

  @Expose()
  watermarkImage: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
