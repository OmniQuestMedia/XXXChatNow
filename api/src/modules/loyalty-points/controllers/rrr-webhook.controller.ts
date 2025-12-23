import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { RRR_WEBHOOK_SECRET, RRRWebhookEventType } from '../constants';
import { RRRWebhookEvent, RRRWebhookEventDocument } from '../schemas';

/**
 * Controller for handling RRR webhooks
 */
@ApiTags('loyalty-points')
@Controller('loyalty-points/webhooks')
export class RRRWebhookController {
  private readonly logger = new Logger(RRRWebhookController.name);

  constructor(
    @InjectModel(RRRWebhookEvent.name)
    private readonly webhookEventModel: Model<RRRWebhookEventDocument>
  ) {}

  /**
   * Verify webhook signature
   */
  private verifySignature(body: string, signature: string): boolean {
    if (!RRR_WEBHOOK_SECRET) {
      this.logger.warn('RRR_WEBHOOK_SECRET not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', RRR_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Check if event has already been processed (idempotency)
   */
  private async isEventProcessed(eventId: string): Promise<boolean> {
    const existing = await this.webhookEventModel.findOne({ event_id: eventId });
    return !!existing;
  }

  /**
   * Mark event as processed
   */
  private async markEventProcessed(eventId: string, eventType: string, data: any): Promise<void> {
    await this.webhookEventModel.create({
      event_id: eventId,
      event_type: eventType,
      data,
      status: 'processed',
      processed_at: new Date()
    });
  }

  /**
   * Handle RRR webhook events
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle RRR webhook events' })
  async handleWebhook(
    @Headers('x-rrr-signature') signature: string,
    @Body() payload: any
  ): Promise<{ received: boolean }> {
    // Verify signature
    const bodyString = JSON.stringify(payload);
    if (!this.verifySignature(bodyString, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { event_type, event_id, data } = payload;

    // Log webhook event (no PII)
    this.logger.log(`Received RRR webhook: ${event_type} (${event_id})`);

    // Check idempotency - if already processed, return success
    if (await this.isEventProcessed(event_id)) {
      this.logger.log(`Event ${event_id} already processed, skipping`);
      return { received: true };
    }

    try {
      switch (event_type) {
        case RRRWebhookEventType.POINTS_POSTED:
          await this.handlePointsPosted(data);
          break;

        case RRRWebhookEventType.POINTS_REVERSED:
          await this.handlePointsReversed(data);
          break;

        case RRRWebhookEventType.REDEMPTION_COMMITTED:
          await this.handleRedemptionCommitted(data);
          break;

        case RRRWebhookEventType.REDEMPTION_REVERSED:
          await this.handleRedemptionReversed(data);
          break;

        case RRRWebhookEventType.LINK_UPDATED:
          await this.handleLinkUpdated(data);
          break;

        case RRRWebhookEventType.PROMOTION_STATUS_CHANGED:
          await this.handlePromotionStatusChanged(data);
          break;

        case RRRWebhookEventType.TRANSFER_COMPLETED:
          await this.handleTransferCompleted(data);
          break;

        case RRRWebhookEventType.TRANSFER_REVERSED:
          await this.handleTransferReversed(data);
          break;

        default:
          this.logger.warn(`Unknown webhook event type: ${event_type}`);
      }

      // Mark as processed to ensure idempotency
      await this.markEventProcessed(event_id, event_type, data);
    } catch (error) {
      this.logger.error(`Error processing webhook ${event_type}`, error.stack);
      throw error;
    }

    return { received: true };
  }

  private async handlePointsPosted(data: any): Promise<void> {
    // Points have been successfully posted to member's account
    const { member_id, points_delta, ledger_entry_id, source_ref } = data;
    
    this.logger.log(`Points posted: ${points_delta} for member ${member_id}, entry: ${ledger_entry_id}`);
    
    // TODO: Update local cache/stats if needed
    // TODO: Send notification to user about points earned
    // Example:
    // await this.notificationService.sendPointsEarnedNotification(member_id, points_delta);
  }

  private async handlePointsReversed(data: any): Promise<void> {
    // Points have been reversed (e.g., chargeback, refund)
    const { member_id, points_delta, reason, ledger_entry_id } = data;
    
    this.logger.log(`Points reversed: ${points_delta} for member ${member_id}, reason: ${reason}`);
    
    // TODO: Update local cache/stats
    // TODO: Send notification to user about points reversal
  }

  private async handleRedemptionCommitted(data: any): Promise<void> {
    // Redemption has been successfully committed
    const { member_id, points_burned, discount_minor, order_id } = data;
    
    this.logger.log(`Redemption committed: ${points_burned} points for member ${member_id}, order: ${order_id}`);
    
    // TODO: Update order records if needed
    // TODO: Clear any cached redemption quotes
  }

  private async handleRedemptionReversed(data: any): Promise<void> {
    // Redemption has been reversed (points restored)
    const { member_id, points_restored, order_id, reason } = data;
    
    this.logger.log(`Redemption reversed: ${points_restored} points restored for member ${member_id}, order: ${order_id}`);
    
    // TODO: Update order records
    // TODO: Send notification about reversal
  }

  private async handleLinkUpdated(data: any): Promise<void> {
    // Link status has changed (activated, revoked, etc.)
    const { member_id, client_user_id, status } = data;
    
    this.logger.log(`Link updated: member ${member_id}, client user ${client_user_id}, status: ${status}`);
    
    // TODO: Update local link cache
    // TODO: Send notification about link status change
  }

  private async handlePromotionStatusChanged(data: any): Promise<void> {
    // Promotion status has changed
    const { promotion_id, status, previous_status } = data;
    
    this.logger.log(`Promotion ${promotion_id} status changed: ${previous_status} -> ${status}`);
    
    // TODO: Update local promotion cache
    // TODO: Notify admins about status change
  }

  private async handleTransferCompleted(data: any): Promise<void> {
    // Points transfer completed (model to viewer, etc.)
    const { from_member_id, to_member_id, points, transfer_id } = data;
    
    this.logger.log(`Transfer completed: ${points} points from ${from_member_id} to ${to_member_id}`);
    
    // TODO: Send notifications to both parties
  }

  private async handleTransferReversed(data: any): Promise<void> {
    // Points transfer has been reversed
    const { from_member_id, to_member_id, points, transfer_id, reason } = data;
    
    this.logger.log(`Transfer reversed: ${points} points, reason: ${reason}`);
    
    // TODO: Send notifications about reversal
  }
}
