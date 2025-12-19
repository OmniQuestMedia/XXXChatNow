/**
 * Slot Machine Spin Payload
 * 
 * Request validation for spin operations.
 * Server-side validation prevents client tampering.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (API Specification)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (Input validation required)
 */

import {
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class SpinPayload {
  @IsNumber()
  @Min(1)
  betAmount: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class SlotMachineHistoryPayload {
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
