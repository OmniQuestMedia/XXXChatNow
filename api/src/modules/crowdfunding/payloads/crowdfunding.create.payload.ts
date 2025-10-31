import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CrowdfundingCreatePayload {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  descriptions: string;

  @IsNumber()
  @IsNotEmpty()
  token: number;
}
