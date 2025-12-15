import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional
} from 'class-validator';

export class SendContributePayload {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  token: number;

  @IsOptional()
  @IsNotEmpty()
  crowdfundfingId: string;
}
