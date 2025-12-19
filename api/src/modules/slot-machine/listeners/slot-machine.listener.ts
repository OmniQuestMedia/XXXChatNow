/**
 * Slot Machine Event Listener
 * 
 * Handles events from slot machine operations for:
 * - Audit logging
 * - Analytics
 * - Notifications
 * 
 * SECURITY: No PII or sensitive data in logs
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { Injectable } from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import {
  SLOT_MACHINE_CHANNEL,
  SLOT_MACHINE_EVENT
} from '../constants';

@Injectable()
export class SlotMachineListener {
  constructor(
    private readonly queueEventService: QueueEventService
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
   * Log for audit trail (no PII)
   */
  private async handleSpinCompleted(event: QueueEvent): Promise<void> {
    const { spinId, userId, isWin, payout, betAmount } = event.data;

    // Log to audit system (no PII - just IDs and amounts)
    console.log('[AUDIT] Slot machine spin completed:', {
      spinId,
      userId, // ID only, no PII
      isWin,
      payout,
      betAmount,
      timestamp: new Date().toISOString()
    });

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
   * Alert for system issues
   */
  private async handleSpinFailed(event: QueueEvent): Promise<void> {
    const { spinId, userId, error } = event.data;

    // Log error for investigation (no PII)
    console.error('[AUDIT] Slot machine spin failed:', {
      spinId,
      userId, // ID only, no PII
      error,
      timestamp: new Date().toISOString()
    });

    // TODO: Alert operations team for system issues
    // await this.alertService.sendAlert({
    //   severity: 'high',
    //   message: 'Slot machine spin failed',
    //   data: { spinId, error }
    // });
  }
}
