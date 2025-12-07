import { IsString } from 'class-validator';

export class PurchaseChipDto {
  @IsString() menuId: string;
  @IsString() chipId: string;
}
