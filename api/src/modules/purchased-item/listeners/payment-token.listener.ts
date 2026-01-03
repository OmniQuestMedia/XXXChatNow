import { QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import {
  PerformerCommissionService,
  PerformerService
} from 'src/modules/performer/services';
import { EVENT, ROLE } from 'src/kernel/constants';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { SocketUserService } from 'src/modules/socket/services/socket-user.service';
import { SettingService } from 'src/modules/settings/services';
import { CONVERSATION_TYPE, MESSAGE_TYPE } from 'src/modules/message/constants';
import { SETTING_KEYS } from 'src/modules/settings/constants';
import { StudioService } from 'src/modules/studio/services';
import { ConversationService } from 'src/modules/message/services';
import { UserDto } from 'src/modules/user/dtos';
import { generateUuid } from 'src/kernel/helpers/string.helper';
import { DBLoggerService } from 'src/modules/logger';
import { PerformanceQueueService } from 'src/modules/performance-queue/services';
import { PurchasedItemDto } from '../dtos';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TYPE,
  SETTLEMENT_STATUS
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
    private readonly performanceQueueService: PerformanceQueueService
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
      
      // Emit TipActivated event if this is a tip transaction that has been settled
      if (transaction.type === PURCHASE_ITEM_TYPE.TIP) {
        await this.emitTipActivatedEvent(
          transaction,
          netPrice,
          commission,
          studioCommision,
          owner,
          performer
        );
      }
      
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

  /**
   * Emit TipActivated event for Lovense integration
   * Only emits if settlement status is SETTLED and enforces idempotency using tipId
   * 
   * @param transaction The tip transaction
   * @param netPrice Net amount after commissions
   * @param commission Performer commission percentage
   * @param studioCommission Studio commission percentage (if applicable)
   * @param tipper The user who sent the tip
   * @param performer The performer receiving the tip
   */
  async emitTipActivatedEvent(
    transaction: PurchasedItemDto,
    netPrice: number,
    commission: number,
    studioCommission: number,
    tipper: any,
    performer: any
  ) {
    try {
      // Check if settlement status is SETTLED
      // For backward compatibility, treat SUCCESS status as SETTLED if settlementStatus is not set
      const settlementStatus = transaction.settlementStatus || SETTLEMENT_STATUS.SETTLED;
      
      if (settlementStatus !== SETTLEMENT_STATUS.SETTLED) {
        this.logger.log(`Skipping TipActivated event emission - settlement status is ${settlementStatus}`, {
          context: 'PaymentTokenListener',
          tipId: transaction._id.toString()
        });
        return;
      }

      // Build TipActivated event payload according to specification
      const tipActivatedPayload = {
        // Idempotency & Identity
        tipId: transaction._id.toString(),
        idempotencyKey: transaction._id.toString(), // Use tipId as idempotency key
        
        // Event Metadata
        eventType: 'TipActivated',
        eventTimestamp: new Date(),
        
        // Financial Details
        totalPrice: transaction.totalPrice,
        netPrice,
        commission,
        studioCommission,
        
        // Participants
        tipper: {
          userId: transaction.sourceId,
          username: tipper?.username || null,
          role: transaction.source
        },
        
        recipient: {
          performerId: transaction.sellerId,
          username: performer?.username || null,
          studioId: performer?.studioId || null
        },
        
        // Ledger References (Audit Trail)
        ledger: {
          transactionId: transaction._id,
          conversationId: transaction.targetId || null
        },
        
        // Settlement Details
        settlement: {
          status: SETTLEMENT_STATUS.SETTLED,
          settledAt: transaction.updatedAt || new Date() // Use transaction update time or current time
        },
        
        // Context & Metadata
        context: {
          conversationType: transaction.extraInfo?.conversationType || null,
          customMessage: transaction.extraInfo?.customMessage || null
        },
        
        // Processing Status
        processed: false
      };

      // Submit to performance queue with idempotency enforcement
      const userIdAsObjectId = transaction.sourceId instanceof Types.ObjectId 
        ? transaction.sourceId 
        : new Types.ObjectId(transaction.sourceId.toString());
      
      await this.performanceQueueService.submitRequest(
        userIdAsObjectId,
        {
          type: 'TipActivated',
          mode: 'fifo',
          payload: tipActivatedPayload,
          priority: 10, // Medium-high priority
          idempotencyKey: transaction._id.toString() // Enforce once-only emission
        }
      );

      this.logger.log('TipActivated event emitted successfully', {
        context: 'PaymentTokenListener',
        tipId: transaction._id.toString(),
        totalPrice: transaction.totalPrice,
        performerId: transaction.sellerId.toString()
      });
    } catch (e) {
      // Log error but don't block the transaction
      // Failed emissions can be retried via admin tools
      this.logger.error('Failed to emit TipActivated event', {
        context: 'PaymentTokenListener',
        error: e.stack || e.message,
        tipId: transaction._id.toString()
      });
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
}
