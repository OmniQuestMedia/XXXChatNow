import {
  Injectable, Logger
} from '@nestjs/common';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { EVENT } from 'src/kernel/constants';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RRRPointsService } from 'src/modules/loyalty-points/services';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_STATUS,
  TIP_ACTIVATED_CHANNEL
} from '../constants';
import { PurchasedItem, TipActivatedEventLog } from '../schemas';
import { PurchasedItemDto, TipActivatedEventDto } from '../dtos';

const POST_TIP_RRR_EARN_AND_EMIT = 'POST_TIP_RRR_EARN_AND_EMIT';

/**
 * Listener that handles tip purchases by:
 * 1. Posting earn event to RRR with deterministic sourceRef
 * 2. Storing RRR ledger entry info on PurchasedItem
 * 3. Emitting TipActivated event only after RRR settlement (posted_at != null)
 * 4. Ensuring idempotency via tip_activated_event_log
 */
@Injectable()
export class PostTipRRREarnAndEmitListener {
  private readonly logger = new Logger('PostTipRRREarnAndEmitListener');

  constructor(
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>,
    @InjectModel(TipActivatedEventLog.name) private readonly TipActivatedEventLogModel: Model<TipActivatedEventLog>,
    private readonly queueEventService: QueueEventService,
    private readonly rrrPointsService: RRRPointsService
  ) {
    this.queueEventService.subscribe(
      PURCHASED_ITEM_SUCCESS_CHANNEL,
      POST_TIP_RRR_EARN_AND_EMIT,
      this.handler.bind(this)
    );
  }

  public async handler(event: QueueEvent) {
    try {
      if (![EVENT.CREATED].includes(event.eventName)) {
        return;
      }

      const purchasedItem: PurchasedItemDto = event.data;

      // Only process tip purchases
      if (purchasedItem.type !== PURCHASE_ITEM_TYPE.TIP) {
        return;
      }

      // Only process successful purchases
      if (purchasedItem.status !== PURCHASE_ITEM_STATUS.SUCCESS) {
        return;
      }

      this.logger.log(`Processing tip purchase: ${purchasedItem._id}`);

      await this.handleTipPurchase(purchasedItem);

    } catch (error) {
      // Log error but don't fail the purchase flow
      this.logger.error(`Failed to process tip RRR earn event for ${event.data?._id}`, error.stack);
    }
  }

  private async handleTipPurchase(purchasedItem: PurchasedItemDto): Promise<void> {
    try {
      const tipId = purchasedItem._id.toString();
      const sourceRef = `purchasedItem:${tipId}`;

      // Calculate points to earn (1 point per token, assuming $1 = 1 token)
      const amountMinor = Math.round(purchasedItem.totalPrice * 100);
      const pointsToEarn = Math.floor(purchasedItem.totalPrice);

      if (pointsToEarn <= 0) {
        this.logger.log(`Tip ${tipId}: No points to earn (amount too small)`);
        return;
      }

      // Use deterministic idempotency key based on tip ID
      const idempotencyKey = `earn_tip_${tipId}`;

      this.logger.log(`Posting earn event for tip ${tipId}: ${pointsToEarn} points`);

      // Post earn event to RRR
      const earnResponse = await this.rrrPointsService.earnFromTokenPurchase(
        purchasedItem.sourceId,
        tipId,
        'USD',
        amountMinor,
        pointsToEarn,
        idempotencyKey,
        {
          product_type: 'tip',
          tip_id: tipId,
          performer_id: purchasedItem.sellerId.toString(),
          conversation_id: purchasedItem.targetId.toString()
        }
      );

      // Update PurchasedItem with RRR ledger info
      await this.PurchasedItemModel.updateOne(
        { _id: purchasedItem._id },
        {
          $set: {
            rrrLedgerEntryId: earnResponse.ledger_entry_id,
            rrrSourceRef: sourceRef,
            rrrPostedAt: earnResponse.posted_at ? new Date(earnResponse.posted_at) : null
          }
        }
      );

      this.logger.log(`Updated tip ${tipId} with RRR ledger info: entry=${earnResponse.ledger_entry_id}, posted=${earnResponse.posted_at}`);

      // Only emit TipActivated if RRR has posted the entry (settled)
      if (earnResponse.posted_at) {
        await this.emitTipActivatedEvent(purchasedItem, earnResponse.ledger_entry_id, sourceRef, earnResponse.posted_at);
      } else {
        this.logger.log(`Tip ${tipId}: RRR entry not yet posted, will not emit TipActivated event`);
      }

    } catch (error) {
      // If user is not linked to RRR, just log and continue
      if (error.message && error.message.includes('not linked')) {
        this.logger.log(`Tip ${purchasedItem._id}: User not linked to RRR, skipping points earn`);
        return;
      }

      // For other errors, log but don't fail
      this.logger.error(`Failed to post tip earn event for ${purchasedItem._id}`, error.stack);
    }
  }

  private async emitTipActivatedEvent(
    purchasedItem: PurchasedItemDto,
    ledgerEntryId: string,
    sourceRef: string,
    postedAt: string
  ): Promise<void> {
    const tipId = purchasedItem._id.toString();
    const eventId = uuidv4();

    try {
      // Check if event was already emitted using the event log
      const existingLog = await this.TipActivatedEventLogModel.findOne({ tipId });
      if (existingLog) {
        this.logger.log(`TipActivated event already emitted for tip ${tipId}, skipping duplicate`);
        return;
      }

      // Try to insert into event log (unique index will prevent duplicates)
      try {
        await this.TipActivatedEventLogModel.create({
          tipId,
          eventId,
          sourceRef,
          createdAt: new Date()
        });
      } catch (insertError) {
        // Duplicate key error - event was already emitted
        if (insertError.code === 11000) {
          this.logger.log(`TipActivated event already emitted for tip ${tipId} (caught by unique index)`);
          return;
        }
        throw insertError;
      }

      // Construct the TipActivated event
      const tipActivatedEvent: TipActivatedEventDto = {
        tipId,
        eventId,
        userId: purchasedItem.sourceId.toString(),
        performerId: purchasedItem.sellerId.toString(),
        amount: purchasedItem.totalPrice,
        conversationId: purchasedItem.targetId.toString(),
        createdAt: purchasedItem.createdAt.toISOString(),
        ledgerEntryId,
        ledgerSourceRef: sourceRef,
        ledgerPostedAt: postedAt
      };

      // Emit the TipActivated event
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TIP_ACTIVATED_CHANNEL,
          eventName: EVENT.CREATED,
          data: tipActivatedEvent
        })
      );

      this.logger.log(`TipActivated event emitted for tip ${tipId} with eventId ${eventId}`);

    } catch (error) {
      this.logger.error(`Failed to emit TipActivated event for tip ${tipId}`, error.stack);
      // Don't throw - the tip purchase was successful, just the event emission failed
    }
  }
}
