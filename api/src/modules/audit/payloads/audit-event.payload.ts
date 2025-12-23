/**
 * Audit Event Payload
 * 
 * Request validation for audit event logging.
 * Prevents malformed or malicious audit data.
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  MaxLength
} from 'class-validator';

export class AuditEventPayload {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  menuKey?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
