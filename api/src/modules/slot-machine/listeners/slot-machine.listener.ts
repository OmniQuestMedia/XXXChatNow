/**
 * Slot Machine Event Listener
 * 
 * Handles events from slot machine operations for:
 * - Audit logging (using structured database logging)
 * - Analytics
 * - Notifications
 * 
 * SECURITY: No PII or sensitive data in logs
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { DBLoggerService } from 'src/modules/logger/db-logger.service';
import {
  SLOT_MACHINE_CHANNEL,
  SLOT_MACHINE_EVENT
} from '../constants';

@Injectable()
export class SlotMachineListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    @Inject(forwardRef(() => DBLoggerService))
    private readonly logger: DBLoggerService
  ) {
    this.queueEventService.subscribe(
      SLOT_MACHINE_CHANNEL,
      SLOT_MACHINE_EVENT.SPIN_COMPLETED,
      this.handleSpinCompleted.bind(this)
    );

    this.queueEventService.subscribe(
      SLOT_MACHINE_CHANNEL,
      SLOT_MACHINE_EVENT.SPIN_FAILED,
      this.handleSpinFailed.bind(this)
    );
  }

  /**
   * Handle completed spin event
   * Log for audit trail using structured database logging (no PII)
   */
  private async handleSpinCompleted(event: QueueEvent): Promise<void> {
    const { spinId, userId, isWin, payout, betAmount } = event.data;

    // Log to structured audit system (no PII - just IDs and amounts)
    await this.logger.log(
      JSON.stringify({
        event: 'slot_machine_spin_completed',
        spinId,
        userId, // ID only, no PII
        isWin,
        payout,
        betAmount,
        timestamp: new Date().toISOString()
      }),
      { context: 'SlotMachineAudit' }
    );

    // TODO: Send to analytics service
    // await this.analyticsService.track({
    //   event: 'slot_machine_spin',
    //   userId,
    //   properties: { isWin, payout, betAmount }
    // });

    // TODO: If big win, send notification
    // if (payout > 1000) {
    //   await this.notificationService.sendBigWinNotification(userId, payout);
    // }
  }

  /**
   * Handle failed spin event
   * Alert for system issues using structured logging
   */
  private async handleSpinFailed(event: QueueEvent): Promise<void> {
    const { spinId, userId, error } = event.data;

    // Log error for investigation using structured database logging (no PII)
    await this.logger.error(
      JSON.stringify({
        event: 'slot_machine_spin_failed',
        spinId,
        userId, // ID only, no PII
        error: error?.message || error,
        timestamp: new Date().toISOString()
      }),
      { context: 'SlotMachineAudit' }
    );

    // TODO: Alert operations team through proper alerting system
    // This should integrate with your incident management system
    // await this.queueEventService.publish(
    //   new QueueEvent({
    //     channel: 'OPERATIONS_ALERTS',
    //     eventName: 'SYSTEM_ERROR',
    //     data: { severity: 'high', message: 'Slot machine spin failed', spinId, error }
    //   })
    // );
  }
}
