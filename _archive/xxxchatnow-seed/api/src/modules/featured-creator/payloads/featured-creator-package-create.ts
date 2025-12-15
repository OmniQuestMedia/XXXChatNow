import {
  IsNotEmpty, IsNumber, IsString, IsOptional
} from 'class-validator';

export class FeaturedCreatorPackageCreatePayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  description: string;
}
