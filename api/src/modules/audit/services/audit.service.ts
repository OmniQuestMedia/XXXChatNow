/**
 * Audit Service
 * 
 * Service for recording audit events.
 * Stub implementation - actual persistence logic to be implemented.
 * 
 * Security:
 * - Never logs PII or sensitive data
 * - All events timestamped with server time
 * - UserId from authenticated session only
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - DECISIONS.md
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { AuditEvent } from '../schemas';
import { AuditEventPayload } from '../payloads';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEvent.name) 
    private readonly auditEventModel: Model<AuditEvent>
  ) {}

  /**
   * Record an audit event
   * 
   * @param userId - User ID from authenticated session
   * @param payload - Audit event data (action, menuKey, metadata)
   * @returns Created audit event
   */
  async recordEvent(
    userId: string | ObjectId,
    payload: AuditEventPayload
  ): Promise<AuditEvent> {
    const event = await this.auditEventModel.create({
      userId: new ObjectId(userId),
      action: payload.action,
      menuKey: payload.menuKey,
      metadata: payload.metadata,
      timestamp: new Date(),
      createdAt: new Date()
    });

    await event.save();
    return event;
  }

  /**
   * Get audit events for a user
   * Stub implementation for future admin/compliance queries
   */
  async getUserEvents(
    userId: string | ObjectId,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    return this.auditEventModel
      .find({ userId: new ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .exec();
  }
}
