import { IsString, IsInt, IsPositive, IsEnum, IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { TokenLotType } from '../entities/token-lot.entity';

export class AwardTokensDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(TokenLotType)
  lotType: TokenLotType;

  @IsInt()
  @IsPositive()
  tokens: number;

  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @IsInt()
  @IsPositive()
  graceHours: number;
}
