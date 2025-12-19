export interface WatermarkTextOptions {
  type: 'text';
  text: string;
  color: string;
  fontSize: number;
  opacity: number;
  bottom: number;
  top: number;
  left: number;
  align: string;
}

export interface WatermarkImageOptions {
  type: 'image';
  filePath: string;
}

export type WatermarkOptions = WatermarkTextOptions | WatermarkImageOptions;