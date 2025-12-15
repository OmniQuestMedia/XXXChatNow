import { IsOptional, IsString, IsArray } from 'class-validator';

export class BlockSettingPayload {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  countries: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds: string[];
}
