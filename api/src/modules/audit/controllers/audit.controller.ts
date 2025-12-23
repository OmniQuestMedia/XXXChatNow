/**
 * Audit Controller
 * 
 * API endpoint for recording audit events from frontend applications.
 * 
 * Security:
 * - Authentication required (@UseGuards)
 * - UserId extracted from authenticated session only
 * - Input validation via DTO
 * - No PII or sensitive data logged
 * 
 * Endpoint:
 * - POST /api/audit/event - Record an audit event
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - DECISIONS.md (Audit requirements)
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Injectable
} from '@nestjs/common';
import { AuthGuard } from 'src/modules/auth/guards';
import { CurrentUser } from 'src/modules/auth/decorators';
import { DataResponse } from 'src/kernel';
import { UserDto } from 'src/modules/user/dtos';
import { AuditService } from '../services';
import { AuditEventPayload } from '../payloads';

@Injectable()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Record an audit event
   * 
   * POST /api/audit/event
   * 
   * Body:
   * {
   *   "action": "slot-machine-spin",
   *   "menuKey": "games",
   *   "metadata": { "betAmount": 10 }
   * }
   * 
   * Security:
   * - Requires authentication
   * - UserId from authenticated session
   * - Never logs PII or sensitive values
   */
  @Post('/event')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  async recordEvent(
    @CurrentUser() user: UserDto,
    @Body() payload: AuditEventPayload
  ) {
    const event = await this.auditService.recordEvent(user._id, payload);
    return DataResponse.ok({
      success: true,
      eventId: event._id
    });
  }
}
