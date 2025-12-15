import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FeaturedCreatorPackageUpdatePayload {
  @IsString()
  @IsOptional()
  name: string;

  @IsNumber()
  @IsOptional()
  price: number;

  @IsString()
  @IsOptional()
  description: string;
}
