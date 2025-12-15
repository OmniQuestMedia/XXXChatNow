import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class TokenPackageSearchPayload extends SearchRequest {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
