/**
 * Audit Event DTO
 * 
 * Data transfer object for audit events.
 * Ensures no PII or sensitive data is exposed.
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { ObjectId } from 'mongodb';
import { Expose, Transform } from 'class-transformer';

export class AuditEventDto {
  @Expose()
  @Transform(({ obj }) => obj._id)
  _id: ObjectId;

  @Expose()
  @Transform(({ obj }) => obj.userId)
  userId: ObjectId;

  @Expose()
  action: string;

  @Expose()
  menuKey?: string;

  @Expose()
  metadata?: Record<string, any>;

  @Expose()
  timestamp: Date;

  @Expose()
  createdAt: Date;
}
