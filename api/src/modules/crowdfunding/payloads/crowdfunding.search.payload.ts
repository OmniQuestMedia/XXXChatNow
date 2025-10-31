import { IsString, IsOptional } from 'class-validator';
import { ObjectId } from 'mongodb';
import { SearchRequest } from 'src/kernel';

export class CrowdfundingSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  performerId: ObjectId;
}
