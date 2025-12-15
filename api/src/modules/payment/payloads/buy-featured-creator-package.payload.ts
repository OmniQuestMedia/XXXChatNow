import { IsNotEmpty } from 'class-validator';

export class BuyFeaturedCreatorPackagePayload {
  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;
}
