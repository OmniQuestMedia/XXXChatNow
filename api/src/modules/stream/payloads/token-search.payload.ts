import {
  IsNotEmpty,
  IsNumber,
  Max
} from 'class-validator';

export class TokenSearchPayload {
  @IsNumber()
  @IsNotEmpty()
  offset: number;

  @IsNumber()
  @Max(50)
  @IsNotEmpty()
  size: number;
}
