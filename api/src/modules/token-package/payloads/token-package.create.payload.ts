import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean
} from 'class-validator';

export class TokenPackageCreatePayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  ordering: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  tokens: number;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
