import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePolicyDto {
  @IsNotEmpty()
  @IsOptional()
  value?: any;

  @IsOptional()
  description?: string;
}
