import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreatePolicyDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  value: any;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  editableBy?: string[];
}
