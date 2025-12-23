/**
 * Audit Module
 * 
 * Module for audit event logging.
 * Records sensitive operations for compliance and security.
 * 
 * Features:
 * - POST /api/audit/event endpoint
 * - Authentication required
 * - No PII or sensitive data logged
 * - Stub implementation for future enhancement
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - DECISIONS.md
 */

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AuditEvent, AuditEventSchema } from './schemas';
import { AuditService } from './services';
import { AuditController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditEvent.name,
        schema: AuditEventSchema
      }
    ]),
    forwardRef(() => AuthModule)
  ],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService]
})
export class AuditModule {}
