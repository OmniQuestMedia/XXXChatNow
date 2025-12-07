// Data Transfer Objects for validation and typing
import { IsString, IsBoolean, IsArray, IsOptional, IsInt, Min, Max, IsNumber } from 'class-validator';
export class CreateMenuDto {
  @IsString() name: string;
  @IsArray() chips: any[]; // Define strong typing if needed
  @IsArray() gratitudeComments: { text: string }[];
  @IsBoolean() soundEnabled: boolean;
  @IsBoolean() animationEnabled: boolean;
  @IsOptional() goal?: any; // Strong type with IGoal if desired
  @IsOptional() themeSkinId?: string;
}
export class UpdateMenuDto extends CreateMenuDto {}
// Flash Discount DTO
export class SetDiscountModifiersDto {
  @IsBoolean() enabled: boolean;
  @IsInt() @Min(1) @Max(99) percent: number;
  @IsInt() @Min(600000) @Max(28800000) durationMs: number;
  @IsString() startTime: string;
  @IsString() endTime: string;
  @IsBoolean() showDiscountedOnly: boolean;
  @IsBoolean() showTimer: boolean;
  @IsOptional() gifWavAt?: any;
  @IsOptional() countdownGifWavStart?: any;
  @IsOptional() countdownGifWavEnd?: any;
}
// Menu Bump DTO
export class SetBumpModifiersDto {
  @IsBoolean() enabled: boolean;
  @IsInt() @Min(1) @Max(99) percent: number;
  @IsOptional() @IsInt() durationMs?: number;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsOptional() @IsBoolean() manualOff?: boolean;
}
// Publishing menu (display toggle)
export class PublishMenuDto {
  @IsBoolean() active: boolean;
}
