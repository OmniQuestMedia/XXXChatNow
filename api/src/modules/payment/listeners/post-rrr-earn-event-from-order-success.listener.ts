import {
  Injectable, Logger
} from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { ORDER_PAID_SUCCESS_CHANNEL, ORDER_STATUS, PRODUCT_TYPE } from 'src/modules/payment/constants';
import { EVENT } from 'src/kernel/constants';
import { OrderDto } from '../dtos';
import { RRRPointsService } from 'src/modules/loyalty-points/services';
import { v4 as uuidv4 } from 'uuid';

const POST_RRR_EARN_EVENT_FROM_ORDER_PAID = 'POST_RRR_EARN_EVENT_FROM_ORDER_PAID';

/**
 * Listener that posts earn events to RedRoomRewards after successful orders
 */
@Injectable()
export class PostRRREarnEventFromOrderSuccessListener {
  private readonly logger = new Logger('PostRRREarnEventFromOrderSuccessListener');

  constructor(
    private readonly queueEventService: QueueEventService,
    private readonly rrrPointsService: RRRPointsService
  ) {
    this.queueEventService.subscribe(
      ORDER_PAID_SUCCESS_CHANNEL,
      POST_RRR_EARN_EVENT_FROM_ORDER_PAID,
      this.handler.bind(this)
    );
  }

  public async handler(event: QueueEvent) {
    try {
      if (![EVENT.CREATED].includes(event.eventName)) {
        return;
      }

      const order: OrderDto = event.data;
      
      // Only process paid orders
      if (order.status !== ORDER_STATUS.PAID) {
        return;
      }

      // Handle token purchases
      if (order.productType === PRODUCT_TYPE.TOKEN || order.type === PRODUCT_TYPE.TOKEN) {
        await this.handleTokenPurchase(order);
      }
      
      // Handle membership purchases
      if (order.productType === PRODUCT_TYPE.MONTHLY_SUBSCRIPTION || 
          order.productType === PRODUCT_TYPE.YEARLY_SUBSCRIPTION ||
          order.type === PRODUCT_TYPE.MONTHLY_SUBSCRIPTION || 
          order.type === PRODUCT_TYPE.YEARLY_SUBSCRIPTION) {
        await this.handleMembershipPurchase(order);
      }

    } catch (error) {
      // Log error but don't fail the order processing
      // RRR points earning is not critical to the main purchase flow
      this.logger.error(`Failed to post RRR earn event for order ${event.data?.orderNumber}`, error.stack);
    }
  }

  private async handleTokenPurchase(order: OrderDto): Promise<void> {
    try {
      // Calculate points to earn (1 point per $1 spent)
      const amountMinor = Math.round(order.totalPrice * 100); // Convert to cents
      const pointsToEarn = Math.floor(amountMinor / 100);

      if (pointsToEarn <= 0) {
        this.logger.log(`Order ${order.orderNumber}: No points to earn (amount too small)`);
        return;
      }

      // Use order number as part of idempotency key to prevent duplicates
      const idempotencyKey = `earn_token_${order.orderNumber}`;

      await this.rrrPointsService.earnFromTokenPurchase(
        order.buyerId,
        order.orderNumber,
        'USD', // TODO: Use actual currency from order if available
        amountMinor,
        pointsToEarn,
        idempotencyKey,
        {
          product_type: 'token_package',
          product_name: order.name,
          order_id: order._id.toString()
        }
      );

      this.logger.log(`Posted ${pointsToEarn} points earn event for token order ${order.orderNumber}`);
    } catch (error) {
      // If user is not linked, just log and continue
      if (error.message.includes('not linked')) {
        this.logger.log(`Order ${order.orderNumber}: User not linked to RRR, skipping points earn`);
        return;
      }
      
      // For other errors, log but don't fail
      this.logger.error(`Failed to post token purchase earn event for order ${order.orderNumber}`, error.stack);
    }
  }

  private async handleMembershipPurchase(order: OrderDto): Promise<void> {
    try {
      // Calculate points to earn (2x multiplier for memberships)
      const amountMinor = Math.round(order.totalPrice * 100); // Convert to cents
      const basePoints = Math.floor(amountMinor / 100);
      const pointsToEarn = basePoints * 2; // 2x multiplier for memberships

      if (pointsToEarn <= 0) {
        this.logger.log(`Order ${order.orderNumber}: No points to earn (amount too small)`);
        return;
      }

      // Determine membership tier
      let membershipTier = 'BASIC';
      if (order.productType === PRODUCT_TYPE.YEARLY_SUBSCRIPTION) {
        membershipTier = 'PREMIUM';
      }

      // Use order number as part of idempotency key to prevent duplicates
      const idempotencyKey = `earn_membership_${order.orderNumber}`;

      await this.rrrPointsService.earnFromMembershipPurchase(
        order.buyerId,
        order.orderNumber,
        'USD', // TODO: Use actual currency from order if available
        amountMinor,
        pointsToEarn,
        idempotencyKey,
        membershipTier
      );

      this.logger.log(`Posted ${pointsToEarn} points earn event for membership order ${order.orderNumber} (tier: ${membershipTier})`);
    } catch (error) {
      // If user is not linked, just log and continue
      if (error.message.includes('not linked')) {
        this.logger.log(`Order ${order.orderNumber}: User not linked to RRR, skipping points earn`);
        return;
      }
      
      // For other errors, log but don't fail
      this.logger.error(`Failed to post membership purchase earn event for order ${order.orderNumber}`, error.stack);
    }
  }
}
