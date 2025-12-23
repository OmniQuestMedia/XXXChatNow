/**
 * Audit Event Schema
 * 
 * Records sensitive operations for compliance and security auditing.
 * Never stores PII or sensitive data values - only action metadata.
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - DECISIONS.md (Audit requirements)
 */

import {
  Prop, Schema, SchemaFactory
} from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'auditevents'
})
export class AuditEvent {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true
  })
  userId: ObjectId;

  @Prop({
    required: true
  })
  action: string;

  @Prop()
  menuKey?: string;

  @Prop({
    type: MongooseSchema.Types.Mixed
  })
  metadata?: Record<string, any>;

  @Prop({
    type: Date,
    default: Date.now,
    index: true
  })
  timestamp: Date;

  @Prop({
    type: Date,
    default: Date.now
  })
  createdAt: Date;
}

export type AuditEventDocument = HydratedDocument<AuditEvent>;

export const AuditEventSchema = SchemaFactory.createForClass(AuditEvent);

// Indexes for efficient querying
AuditEventSchema.index({ userId: 1, timestamp: -1 }, {
  name: 'idx_user_timestamp'
});
AuditEventSchema.index({ action: 1, timestamp: -1 }, {
  name: 'idx_action_timestamp'
});
