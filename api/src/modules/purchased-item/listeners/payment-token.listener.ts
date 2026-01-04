import { QueueEvent, QueueEventService } from 'src/kernel';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/modules/user/services';
import {
  PerformerCommissionService,
  PerformerService
} from 'src/modules/performer/services';
import { EVENT, ROLE } from 'src/kernel/constants';
import { ObjectId } from 'mongodb';
import { Model, Types } from 'mongoose';
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
import { InjectModel } from '@nestjs/mongoose';
import { PurchasedItemDto } from '../dtos';
import {
  PURCHASED_ITEM_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TYPE,
  SETTLEMENT_STATUS
} from '../constants';
import { PurchasedItem } from '../schemas/purchase-item.schema';
import { User } from 'src/modules/user/schemas/user.schema';
import { Performer } from 'src/modules/performer/schemas/performer.schema';
import { Earning } from 'src/modules/earning/schemas/earning.schema';

const HANDLE_PAYMENT_TOKEN = 'HANDLE_PAYMENT_TOKEN';
const RECEIVED_PAID_TOKEN = 'RECEIVED_PAID_TOKEN';

@Injectable()
export class PaymentTokenListener {
  constructor(
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>,
    @InjectModel(User.name) private readonly UserModel: Model<User>,
    @InjectModel(Performer.name) private readonly PerformerModel: Model<Performer>,
    @InjectModel(Earning.name) private readonly EarningModel: Model<Earning>,
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
    const { status } = transaction;
    
    try {
      if (
        eventName !== EVENT.CREATED
        || status !== PURCHASE_ITEM_STATUS.SUCCESS
      ) {
        return;
      }

      // Check if this is a money-moving transaction that requires atomic settlement
      const isMoneyMoving = [
        PURCHASE_ITEM_TYPE.TIP,
        PURCHASE_ITEM_TYPE.PRIVATE,
        PURCHASE_ITEM_TYPE.TIP_GRID_ITEM
      ].includes(transaction.type);

      if (isMoneyMoving) {
        // Use gold standard settlement with MongoDB transaction
        await this.handleMoneyMovingTransaction(transaction);
      } else {
        // Use legacy settlement for other types
        await this.handleLegacyTransaction(transaction);
      }
    } catch (e) {
      this.logger.error(e.stack || e, { context: 'PaymentTokenListener' });
    }
  }

  /**
   * Gold standard settlement for money-moving transactions
   * Implements atomic settlement with idempotency and non-negative balance enforcement
   */
  private async handleMoneyMovingTransaction(transaction: PurchasedItemDto) {
    const session = await this.PurchasedItemModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. Authoritative reload + idempotency gate
        const purchasedItem = await this.PurchasedItemModel.findById(transaction._id).session(session);
        
        if (!purchasedItem) {
          this.logger.error('PurchasedItem not found during settlement', {
            context: 'PaymentTokenListener',
            transactionId: transaction._id
          });
          return;
        }

        // Early out if already settled
        if (purchasedItem.settlementStatus === SETTLEMENT_STATUS.SETTLED) {
          this.logger.log('PurchasedItem already settled, skipping', {
            context: 'PaymentTokenListener',
            transactionId: transaction._id,
            settlementStatus: purchasedItem.settlementStatus
          });
          return;
        }

        // Early out if not pending
        if (purchasedItem.settlementStatus !== SETTLEMENT_STATUS.PENDING) {
          this.logger.log('PurchasedItem not in pending state, skipping', {
            context: 'PaymentTokenListener',
            transactionId: transaction._id,
            settlementStatus: purchasedItem.settlementStatus
          });
          return;
        }

        // 2. Mark as processing
        await this.PurchasedItemModel.updateOne(
          { _id: purchasedItem._id },
          { $set: { settlementStatus: SETTLEMENT_STATUS.PROCESSING } }
        ).session(session);

        const performerId = purchasedItem.sellerId;
        const [owner, performer] = await Promise.all([
          this.getUser(purchasedItem.source as string, purchasedItem.sourceId),
          performerId ? await this.performerService.findById(performerId) : null
        ]);

        if (!owner || !performer) {
          await this.PurchasedItemModel.updateOne(
            { _id: purchasedItem._id },
            { $set: { settlementStatus: SETTLEMENT_STATUS.FAILED } }
          ).session(session);
          this.logger.error('Owner or performer not found', {
            context: 'PaymentTokenListener',
            transactionId: transaction._id
          });
          return;
        }

        // 3. Perform conditional debit with DB-level non-negative enforcement
        const debitResult = await this.UserModel.updateOne(
          {
            _id: purchasedItem.sourceId,
            balance: { $gte: purchasedItem.totalPrice }
          },
          {
            $inc: {
              balance: -purchasedItem.totalPrice,
              'stats.totalTokenSpent': purchasedItem.totalPrice
            }
          }
        ).session(session);

        // 4. On debit fail, mark as FAILED
        if (debitResult.modifiedCount === 0) {
          await this.PurchasedItemModel.updateOne(
            { _id: purchasedItem._id },
            { $set: { settlementStatus: SETTLEMENT_STATUS.FAILED } }
          ).session(session);
          this.logger.error('Insufficient balance for debit', {
            context: 'PaymentTokenListener',
            transactionId: transaction._id,
            userId: purchasedItem.sourceId,
            amount: purchasedItem.totalPrice
          });
          return;
        }

        // Calculate commissions
        const commissionData = await this.calculateCommissions(performer, purchasedItem);
        const { commission, studioCommision, grossPrice, netPrice } = commissionData;

        // 5. Credit recipients atomically
        await this.PerformerModel.updateOne(
          { _id: performer._id },
          {
            $inc: {
              balance: netPrice,
              'stats.totalTokenEarned': netPrice
            }
          }
        ).session(session);

        // Credit studio if applicable
        if (performer.studioId) {
          await this.studioService.increaseBalance(
            performer.studioId,
            (purchasedItem.totalPrice * studioCommision) / 100
          );
        }

        // Update user rank
        await this.userService.userRank(performerId, purchasedItem.totalPrice, purchasedItem.sourceId);

        // 6. Create Earning record
        const earningType = purchasedItem.type === PURCHASE_ITEM_TYPE.TIP_GRID_ITEM 
          ? 'tip_grid_item' 
          : purchasedItem.type;

        const conversionRate = await this.settingService.getKeyValue(SETTING_KEYS.CONVERSION_RATE) || 1;
        
        const earningData = {
          conversionRate,
          originalPrice: purchasedItem.totalPrice,
          grossPrice,
          commission,
          netPrice,
          performerId: purchasedItem.sellerId,
          userId: purchasedItem.sourceId,
          transactionTokenId: purchasedItem._id,
          type: earningType,
          createdAt: purchasedItem.createdAt,
          transactionStatus: purchasedItem.status,
          sourceId: purchasedItem.sourceId,
          targetId: purchasedItem.sellerId,
          source: ROLE.USER,
          target: ROLE.PERFORMER,
          studioToModel: performer.studioId ? {
            grossPrice,
            commission,
            netPrice
          } : undefined
        };

        await this.EarningModel.create([earningData], { session });

        // 7. Mark PurchasedItem as settled
        await this.PurchasedItemModel.updateOne(
          { _id: purchasedItem._id },
          { $set: { settlementStatus: SETTLEMENT_STATUS.SETTLED } }
        ).session(session);

        this.logger.log('Transaction settled successfully', {
          context: 'PaymentTokenListener',
          transactionId: transaction._id,
          type: purchasedItem.type
        });
      });

      // 8. After commit, emit chat message + mood event
      await this.notifyAfterSettlement(transaction);
      
      // Emit TipActivated event if this is a tip transaction
      if (transaction.type === PURCHASE_ITEM_TYPE.TIP || transaction.type === PURCHASE_ITEM_TYPE.TIP_GRID_ITEM) {
        const [owner, performer] = await Promise.all([
          this.getUser(transaction.source, transaction.sourceId),
          transaction.sellerId ? await this.performerService.findById(transaction.sellerId) : null
        ]);
        
        if (owner && performer) {
          const commissionData = await this.calculateCommissions(performer, transaction);
          await this.emitTipActivatedEvent(
            transaction,
            commissionData.netPrice,
            commissionData.commission,
            commissionData.studioCommision,
            owner,
            performer
          );
        }
      }
    } catch (e) {
      this.logger.error('Error in money-moving transaction settlement', {
        context: 'PaymentTokenListener',
        error: e.stack || e.message,
        transactionId: transaction._id
      });
      
      // Try to mark as failed if safe
      try {
        await this.PurchasedItemModel.updateOne(
          { _id: transaction._id, settlementStatus: SETTLEMENT_STATUS.PROCESSING },
          { $set: { settlementStatus: SETTLEMENT_STATUS.FAILED } }
        );
      } catch (updateError) {
        this.logger.error('Failed to mark transaction as failed', {
          context: 'PaymentTokenListener',
          error: updateError.stack || updateError.message,
          transactionId: transaction._id
        });
      }
    } finally {
      await session.endSession();
    }
  }

  /**
   * Calculate commissions for a transaction
   */
  private async calculateCommissions(performer: any, transaction: any) {
    let commission = 0;
    let studioCommision = 0;
    const [
      defaultPerformerCommission,
      defaultStudioCommission,
      performerCommission
    ] = await Promise.all([
      this.settingService.getKeyValue(SETTING_KEYS.PERFORMER_COMMISSION),
      this.settingService.getKeyValue(SETTING_KEYS.STUDIO_COMMISSION),
      this.performerCommission.findOne({ performerId: performer._id })
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
        case PURCHASE_ITEM_TYPE.TIP_GRID_ITEM:
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
        case PURCHASE_ITEM_TYPE.TIP_GRID_ITEM:
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

    const netPrice = performer.studioId 
      ? (transaction.totalPrice * (studioCommision / 100)) * (commission / 100)
      : transaction.totalPrice * (commission / 100);
    const grossPrice = performer.studioId 
      ? transaction.totalPrice * (studioCommision / 100) 
      : transaction.totalPrice;

    return { commission, studioCommision, grossPrice, netPrice };
  }

  /**
   * Legacy handler for non-money-moving transactions
   */
  private async handleLegacyTransaction(transaction: PurchasedItemDto) {
    const {
      sourceId, source, totalPrice
    } = transaction;
    const performerId = transaction.sellerId;

    const [owner, performer] = await Promise.all([
      this.getUser(source, sourceId),
      performerId ? await this.performerService.findById(performerId) : null
    ]);

    if (!owner || !performer) return;

    await this.userService.userRank(performerId, totalPrice, sourceId);

    const commissionData = await this.calculateCommissions(performer, transaction);
    const { commission, studioCommision, grossPrice, netPrice } = commissionData;

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
  }

  /**
   * Notify after settlement (used for money-moving transactions)
   */
  private async notifyAfterSettlement(transaction: PurchasedItemDto) {
    try {
      const performerId = transaction.sellerId;
      const performer = await this.performerService.findById(performerId);
      if (!performer) return;

      const commissionData = await this.calculateCommissions(performer, transaction);
      const { netPrice } = commissionData;

      await this.notify(transaction, netPrice);
    } catch (e) {
      this.logger.error('Error in notification after settlement', {
        context: 'PaymentTokenListener',
        error: e.stack || e.message,
        transactionId: transaction._id
      });
    }
  }

  async notify(transaction: PurchasedItemDto, netPrice: number) {
    try {
      const {
        targetId, sourceId, type, totalPrice, extraInfo
      } = transaction;
      const performerId = transaction.sellerId;
      if (type === PURCHASE_ITEM_TYPE.TIP || type === PURCHASE_ITEM_TYPE.TIP_GRID_ITEM) {
        const [user, conversation] = await Promise.all([
          this.userService.findById(sourceId),
          targetId && this.conversationService.findById(targetId)
        ]);
        const senderInfo = user && new UserDto(user).toResponse(true);
        const messageText = type === PURCHASE_ITEM_TYPE.TIP_GRID_ITEM
          ? `has sent a tip from the tip grid: ${totalPrice} tokens`
          : `has tipped ${totalPrice} tokens`;
        const message = {
          conversationId: conversation._id,
          _id: generateUuid(),
          senderInfo,
          token: totalPrice,
          text: messageText,
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
