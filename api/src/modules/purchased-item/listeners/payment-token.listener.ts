import { QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import {
  PerformerCommissionService,
  PerformerService
} from 'src/modules/performer/services';
import { EVENT, ROLE } from 'src/kernel/constants';
import { ObjectId } from 'mongodb';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { SettingService } from 'src/modules/settings/services';
import { CONVERSATION_TYPE, MESSAGE_TYPE } from 'src/modules/message/constants';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { StudioService } from 'src/modules/studio/services';
import { ConversationService } from 'src/modules/message/services';
import { UserDto } from 'src/modules/user/dtos';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { DBLoggerService } from 'src/modules/logger';
import { RRRApiClientService } from 'src/modules/loyalty-points/services';
import { RRRLedgerEntryDto } from 'src/modules/loyalty-points/dtos';
import { PurchasedItemDto, TipActivatedDto, TipActivatedLedgerDto } from '../dtos';
import { TipActivatedEventLogService } from '../services';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TYPE,
  TIP_ACTIVATED_CHANNEL
} from '../constants';

const HANDLE_PAYMENT_TOKEN = 'HANDLE_PAYMENT_TOKEN';
const RECEIVED_PAID_TOKEN = 'RECEIVED_PAID_TOKEN';

@Injectable()
export class PaymentTokenListener {
  constructor(
    private readonly userService: UserService,
    private readonly performerService: PerformerService,
    private readonly queueEventService: QueueEventService,
    private readonly socketUserService: SocketUserService,
    private readonly settingService: SettingService,
    private readonly performerCommission: PerformerCommissionService,
    private readonly studioService: StudioService,
    private readonly conversationService: ConversationService,
    private readonly logger: DBLoggerService,
    private readonly rrrApiClient: RRRApiClientService,
    private readonly tipActivatedEventLogService: TipActivatedEventLogService
  ) {
    this.queueEventService.subscribe(
      PURCHASED_ITEM_SUCCESS_CHANNEL,
      HANDLE_PAYMENT_TOKEN,
      this.handler.bind(this)
    );
  }

  async handler(event: QueueEvent) {
    const { eventName } = event;
    const transaction: PurchasedItemDto = event.data;
    const {
      sourceId, source, status, totalPrice
    } = transaction;
    const performerId = transaction.sellerId;
    try {
      if (
        eventName !== EVENT.CREATED
        || status !== PURCHASE_ITEM_STATUS.SUCCESS
      ) {
        return;
      }

      const [owner, performer] = await Promise.all([
        this.getUser(source, sourceId),
        performerId ? await this.performerService.findById(performerId) : null
      ]);

      if (!owner || !performer) return;

      await this.userService.userRank(performerId, totalPrice, sourceId);


      let commission = 0;
      let studioCommision = 0;
      const [
        defaultPerformerCommission,
        defaultStudioCommission,
        performerCommission
      ] = await Promise.all([
        this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_COMMISSION),
        this.settingService.getKeyValue(SETTING_KEYS.STUDIO_COMMISSION),
        this.performerCommission.findOne({ performerId: performer._id }),
        this.settingService.getKeyValue(SETTING_KEYS.CONVERSION_RATE)
      ]);
      if (performer.studioId) {
        const studio = await this.studioService.findById(performer.studioId);
        studioCommision = studio.commission || defaultStudioCommission;
        commission = performerCommission?.memberCommission || defaultPerformerCommission;
        switch (transaction.type) {
          case PURCHASE_ITEM_TYPE.GROUP:
            studioCommision = studio.groupCallCommission || defaultStudioCommission;
            commission = performerCommission?.groupCallCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRIVATE:
            studioCommision = studio.privateCallCommission || defaultStudioCommission;
            commission = performerCommission?.privateCallCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.TIP:
            studioCommision = studio.tipCommission || defaultStudioCommission;
            commission = performerCommission?.tipCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRODUCT:
            studioCommision = studio.productCommission || defaultStudioCommission;
            commission = performerCommission?.productCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.PHOTO:
            studioCommision = studio.albumCommission || defaultStudioCommission;
            commission = performerCommission?.albumCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          case PURCHASE_ITEM_TYPE.SALE_VIDEO:
            studioCommision = studio.videoCommission || defaultStudioCommission;
            commission = performerCommission?.videoCommission || performerCommission?.memberCommission || defaultPerformerCommission;
            break;
          default:
            break;
        }
      } else if (performerCommission) {
        switch (transaction.type) {
          case PURCHASE_ITEM_TYPE.GROUP:
            commission = performerCommission.groupCallCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRIVATE:
            commission = performerCommission.privateCallCommission;
            break;
          case PURCHASE_ITEM_TYPE.TIP:
            commission = performerCommission.tipCommission;
            break;
          case PURCHASE_ITEM_TYPE.PRODUCT:
            commission = performerCommission.productCommission;
            break;
          case PURCHASE_ITEM_TYPE.PHOTO:
            commission = performerCommission.albumCommission;
            break;
          case PURCHASE_ITEM_TYPE.SALE_VIDEO:
            commission = performerCommission.videoCommission;
            break;
          default:
            break;
        }
      } else {
        commission = defaultPerformerCommission;
      }
      const grossPrice = performer.studioId ? totalPrice * (studioCommision / 100) : totalPrice;
      const netPrice = grossPrice * (commission / 100);

      const user = await this.userService.findById(transaction.sourceId);

      const message = {
        conversationId: transaction.targetId,
        _id: generateUuid(),
        senderInfo: user,
        token: totalPrice,
        text: `paid ${totalPrice} tokens / minute`,
        type: MESSAGE_TYPE.TIP
      };

      await Promise.all([
        this.performerService.increaseBalance(performer._id, netPrice),
        performer.studioId
        && this.studioService.increaseBalance(
          performer.studioId,
          (totalPrice * studioCommision) / 100
        ),

        source === ROLE.USER
          ? this.userService.increaseBalance(
            transaction.sourceId,
            totalPrice * -1
          )
          : this.performerService.increaseBalance(
            transaction.sourceId,
            totalPrice * -1
          ),

        transaction
        && this.socketUserService.emitToRoom(
          this.conversationService.serializeConversation(
            transaction.targetId,
            transaction.type
          ),
          `message_created_conversation_${transaction.targetId}`,
          message
        )
      ]);
      await this.notify(transaction, netPrice);
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'PaymentTokenListener' });
    }
  }

  async notify(transaction: PurchasedItemDto, netPrice: number) {
    try {
      const {
        targetId, sourceId, type, totalPrice, extraInfo
      } = transaction;
      const performerId = transaction.sellerId;
      if (type === PURCHASE_ITEM_TYPE.TIP) {
        const [user, conversation] = await Promise.all([
          this.userService.findById(sourceId),
          targetId && this.conversationService.findById(targetId)
        ]);
        const senderInfo = user && new UserDto(user).toResponse(true);
        const message = {
          conversationId: conversation._id,
          _id: generateUuid(),
          senderInfo,
          token: totalPrice,
          text: `has tipped ${totalPrice} tokens`,
          type: MESSAGE_TYPE.TIP
        };

        await Promise.all([
          conversation
          && this.socketUserService.emitToRoom(
            this.conversationService.serializeConversation(
              conversation._id,
              conversation.type
            ),
            `message_created_conversation_${conversation._id}`,
            message
          ),
          conversation && conversation.type === CONVERSATION_TYPE.PERFORMER_COMMUNITY
          && this.socketUserService.emitToUsers(
            conversation.recipients.map((receipent) => receipent.sourceId),
            'message_created',
            message
          ),
          this.socketUserService.emitToUsers(performerId, 'tipped', {
            senderInfo,
            token: totalPrice,
            netPrice
          })
        ]);

        // Emit TipActivated event with RRR ledger as source of truth
        await this.emitTipActivatedEvent(transaction);
      } else if ([PURCHASE_ITEM_TYPE.GROUP, PURCHASE_ITEM_TYPE.PRIVATE].includes(type)) {
        this.socketUserService.emitToUsers(performerId, RECEIVED_PAID_TOKEN, {
          conversationId: targetId,
          token: totalPrice,
          netPrice
        });
      } else if (type === PURCHASE_ITEM_TYPE.SPIN_WHEEL) {
        const [conversation] = await Promise.all([
          extraInfo.conversationId && this.conversationService.findById(extraInfo.conversationId)
        ]);
        setTimeout(() => this.socketUserService.emitToRoom(
          this.conversationService.serializeConversation(conversation._id, conversation.type),
          `message_created_conversation_${conversation._id}`,
          {
            text: transaction.description,
            _id: generateUuid(),
            conversationId: conversation._id,
            isSystem: true,
            type: MESSAGE_TYPE.WHEEL,
            performerId,
            wheelResultId: generateUuid()
          }
        ), 10000);
      } else {
        this.socketUserService.emitToUsers(performerId, 'purchase_media_item_success', {
          transaction,
          token: totalPrice,
          netPrice
        });
      }
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'PaymentTokenListener' });
    }
  }

  async getUser(role: string, id: ObjectId) {
    if (!role || !id) return null;

    let user = null;
    if (role === ROLE.USER) {
      user = await this.userService.findById(id);
    } else if (role === ROLE.PERFORMER) {
      user = await this.performerService.findById(id);
    }
    // else if (role === Role.Studio) {
    //   user = await this.studioService.findById(id);
    // }

    return user;
  }

  /**
   * Emit TipActivated event with RRR ledger as source of truth
   * Only emits if RRR ledger entry has posted_at set (indicating SETTLED status)
   * Implements idempotency via tip_activated_event_log collection
   */
  async emitTipActivatedEvent(transaction: PurchasedItemDto) {
    try {
      const tipId = transaction._id.toString();

      // Check idempotency first - have we already emitted this event?
      const alreadyEmitted = await this.tipActivatedEventLogService.hasEventBeenEmitted(tipId);
      if (alreadyEmitted) {
        this.logger.log(`TipActivated event already emitted for tipId: ${tipId}. Skipping (idempotent).`);
        return;
      }

      // Get source_ref from transaction extraInfo or generate one
      // In a real implementation, this should come from the transaction creation
      const sourceRef = transaction.extraInfo?.rrrSourceRef || `TIP_${tipId}`;

      // Query RRR API for ledger entries using source_ref
      // Note: We need the performer's RRR member ID to query the ledger
      // For now, we'll skip the RRR query if we don't have the member ID
      // In production, this should be retrieved from the performer's RRR account link
      
      // TODO: Get performer's RRR member ID from RRRAccountLink
      // const performerRRRMemberId = await this.rrrAccountLinkService.getMemberIdByUserId(transaction.sellerId);
      
      // For now, we'll create a mock ledger response to demonstrate the structure
      // In production, this would be: const ledgerEntries = await this.rrrApiClient.getLedger(performerRRRMemberId, { source_ref: sourceRef });
      
      // Since we can't query RRR without a member ID, we'll log and skip for now
      // This is a placeholder implementation that will be completed when RRR integration is fully set up
      this.logger.log(
        `TipActivated event emission requires RRR ledger query for tipId: ${tipId}, sourceRef: ${sourceRef}. ` +
        `This will be implemented when RRR account linking is complete.`
      );

      // The following code demonstrates the intended flow once RRR integration is complete:
      /*
      const ledgerEntries = await this.rrrApiClient.getLedger(
        performerRRRMemberId,
        { source_ref: sourceRef }
      );

      if (!ledgerEntries || ledgerEntries.length === 0) {
        this.logger.warn(`No RRR ledger entries found for tipId: ${tipId}, sourceRef: ${sourceRef}`);
        return;
      }

      // Find entries with posted_at set (SETTLED status)
      const settledEntries = ledgerEntries.filter(entry => entry.posted_at);

      if (settledEntries.length === 0) {
        this.logger.log(`No settled RRR ledger entries found for tipId: ${tipId}. Skipping TipActivated emission.`);
        return;
      }

      // Determine debit/credit refs based on number of entries
      let debitRef: string | null = null;
      let creditRef: string | null = null;

      if (settledEntries.length >= 2) {
        // If we have two entries for the same source_ref (e.g., TRANSFER_OUT + TRANSFER_IN)
        const debitEntry = settledEntries.find(e => e.points_delta < 0);
        const creditEntry = settledEntries.find(e => e.points_delta > 0);
        
        if (debitEntry) debitRef = debitEntry.entry_id;
        if (creditEntry) creditRef = creditEntry.entry_id;
      }
      // If only one entry exists, both debitRef and creditRef remain null (as required)

      // Use the first settled entry as the primary ledger entry
      const primaryEntry = settledEntries[0];

      const ledger: TipActivatedLedgerDto = {
        ledgerId: primaryEntry.entry_id,
        sourceRef: primaryEntry.source_ref,
        debitRef,
        creditRef,
        status: 'SETTLED',
        postedAt: primaryEntry.posted_at
      };

      const tipActivatedPayload: TipActivatedDto = {
        tipId,
        userId: transaction.sourceId.toString(),
        performerId: transaction.sellerId.toString(),
        conversationId: transaction.targetId?.toString(),
        amount: transaction.totalPrice,
        ledger,
        createdAt: transaction.createdAt.toISOString()
      };

      // Generate unique event ID
      const eventId = generateUuid();

      // Persist event (implements idempotency)
      const persisted = await this.tipActivatedEventLogService.persistEvent(eventId, tipActivatedPayload);

      if (persisted) {
        // Emit the event to the queue
        await this.queueEventService.publish(
          new QueueEvent({
            channel: TIP_ACTIVATED_CHANNEL,
            eventName: 'TipActivated',
            data: tipActivatedPayload
          })
        );

        this.logger.log(
          `TipActivated event emitted: tipId=${tipId}, eventId=${eventId}, ledgerId=${ledger.ledgerId}`
        );
      }
      */
    } catch (e) {
      this.logger.error(
        `Failed to emit TipActivated event for transaction ${transaction._id}`,
        e.stack || e
      );
      // Don't throw - this is a secondary concern and shouldn't block the main tip processing
    }
  }
}
