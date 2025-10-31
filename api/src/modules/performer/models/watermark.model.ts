import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export class WatermarkSettingModel extends Document {
  sourceId: ObjectId;

  watermarkEnabled: boolean;

  watermarkStreamEnabled: boolean;

  type: string;

  // Text
  watermarkText: string;

  watermarkOpacity: number;

  watermarkColor: string;

  watermarkFontSize: number;

  watermarkTop: number;

  watermarkBottom: number;

  watermarkLeft: number;

  watermarkAlign: string;

  // Image
  watermarkImageId: ObjectId;

  createdAt: Date;

  updatedAt: Date;
}
