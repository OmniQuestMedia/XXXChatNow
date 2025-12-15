import {
  IsString,
  IsOptional,
  IsNotEmpty
} from 'class-validator';

export class ShippingInfoPayload {
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsOptional()
  postalCode: string;
}
