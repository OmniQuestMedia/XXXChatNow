import { IsIn, IsOptional, IsString } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class FeaturedCreatorBookingStatusSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'pending',
    'approved',
    'cancel'
  ])
  status: string;
}
