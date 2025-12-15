import { IsString, IsOptional } from 'class-validator';

export class OrderUpdatePayload {
  @IsString()
  @IsOptional()
  deliveryStatus: string;

  @IsString()
  @IsOptional()
  shippingCode: string;
}
