import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class FeaturedCreatorBookingUpdatePayload {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'pending',
    'approved',
    'rejected'
  ])
  status: string;
}
