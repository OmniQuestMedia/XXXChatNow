import {
  IsNotEmpty, IsOptional, IsString
} from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class StreamGoalPayload {
  @IsNotEmpty()
  goals: any;

  @IsOptional()
  @IsString()
  description: string;
}

export class SearchStreamGoalPayload extends SearchRequest {
  @IsOptional()
  @IsString()
  performerId: string;

  @IsOptional()
  @IsString()
  streamId: string;
}
