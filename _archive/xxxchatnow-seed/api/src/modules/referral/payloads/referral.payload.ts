import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { SearchRequest } from 'src/kernel';

export class ReferralStats {
  @IsString()
  @IsOptional()
  registerId: string;

  @IsString()
  @IsOptional()
  referralId: string;
}

export class ReferralSearch extends SearchRequest {
  @IsString()
  @IsOptional()
  referralId: string;

  @IsString()
  @IsOptional()
  fromDate: string;

  @IsString()
  @IsOptional()
  toDate: string;
}

export class NewReferralUserPayload {
  @IsString()
  @IsNotEmpty()
  registerSource: string;

  @IsString()
  @IsNotEmpty()
  registerId: any;

  @IsString()
  @IsNotEmpty()
  code: string;
}
