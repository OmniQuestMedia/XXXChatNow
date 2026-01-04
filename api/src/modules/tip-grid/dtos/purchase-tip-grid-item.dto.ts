import {
  IsString, IsOptional
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseTipGridItemDto {
  @ApiProperty()
  @IsString()
  tipMenuItemId: string;

  @ApiProperty()
  @IsString()
  performerId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
