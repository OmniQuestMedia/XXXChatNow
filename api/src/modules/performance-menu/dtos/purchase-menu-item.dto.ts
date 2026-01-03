/**
 * Purchase Menu Item DTO
 * 
 * Validates user input for purchasing menu items.
 * All security validations enforced server-side.
 * 
 * Reference: MODEL_PERFORMANCE_MENU.md, SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseMenuItemDto {
  @ApiProperty({
    description: 'Menu ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsString()
  menu_id: string;

  @ApiProperty({
    description: 'Menu Item ID to purchase',
    example: '507f1f77bcf86cd799439012'
  })
  @IsNotEmpty()
  @IsString()
  menu_item_id: string;

  @ApiProperty({
    description: 'Optional idempotency key to prevent duplicate purchases',
    example: 'unique-key-123',
    required: false
  })
  @IsOptional()
  @IsString()
  idempotency_key?: string;

  @ApiProperty({
    description: 'Optional metadata for purchase tracking',
    example: { source: 'web', campaign: 'promo-2026' },
    required: false
  })
  @IsOptional()
  metadata?: any;
}
