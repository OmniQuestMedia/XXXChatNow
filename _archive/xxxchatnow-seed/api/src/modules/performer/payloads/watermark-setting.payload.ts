import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';

export class WatermarkSettingPayload {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  watermarkEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  watermarkStreamEnabled: boolean;

  @IsOptional()
  @IsIn(['text', 'image'])
  type: string;

  @IsOptional()
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  watermarkText: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  watermarkOpacity: number;

  @IsOptional()
  @IsString()
  watermarkColor: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  watermarkFontSize: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  watermarkBottom: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  watermarkTop: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  watermarkLeft: number;

  @IsOptional()
  @IsIn(['top', 'middle', 'bottom'])
  watermarkAlign: string;
}
