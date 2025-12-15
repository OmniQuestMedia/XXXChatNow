import { IsString, IsOptional, IsIn } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class FeaturedCreatorBookingSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'created',
    'paid',
    'rejected'
  ])
  status: string;
}
