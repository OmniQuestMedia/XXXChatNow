import {
  IsOptional, IsString, IsNumber, Min
} from 'class-validator';

export class PurchaseProductsPayload {
  @IsString()
  @IsOptional()
  deliveryAddress: string;

  @IsString()
  @IsOptional()
  postalCode: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity: number;
}
