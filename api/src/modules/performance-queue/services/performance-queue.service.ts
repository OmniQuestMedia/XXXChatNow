/**
 * Performance Queue Service
 * 
 * Core queue management service implementing FIFO ordering per performer.
 * This service is the sole authority for queue lifecycle management,
 * settlement, and refunds per the Integration Contract.
 * 
 * Key Responsibilities:
 * - Accept standardized queue intake payloads from features
 * - Enforce FIFO ordering per performer
 * - Manage queue depth limits
 * - Handle idempotency to prevent duplicates
 * - Detect and handle queue mode (ON vs OFF)
 * - Auto-start and auto-finish in pass-through mode
 * - State machine management (created -> started -> finished/abandoned/refunded)
 * 
 * Security Features:
 * - All operations require idempotency keys
 * - Complete audit trail for all state transitions
 * - No PII in logs
 * - Server-side only operations
 * 
 * References:
 * - XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md
 * - CURRENT_STATUS_AND_NEXT_STEPS.md (Section 3)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  QueueItem,
  QueueItemDocument
} from '../schemas';
import {
  QueueIntakePayload,
  QueuePositionResponse,
  RefundReason
} from '../payloads';
import {
  QueueItemStatus,
  QueueMode,
  QUEUE_LIMITS,
  QUEUE_ERRORS
} from '../constants';

@Injectable()
export class PerformanceQueueService {
  private readonly logger = new Logger(PerformanceQueueService.name);

  constructor(
    @InjectModel(QueueItem.name)
    private readonly queueItemModel: Model<QueueItemDocument>
  ) {}

  /**
   * Create a new queue item from standardized intake payload
   * 
   * This is the main entry point for all interactive features.
   * Handles mode detection and applies appropriate logic (auto-start/finish or queue).
   * 
   * Mode Logic:
   * - If queue mode is OFF: Auto-start and auto-finish immediately (pass-through)
   * - If queue mode is ON: Add to FIFO queue with proper position
   * 
   * @param intake - Standardized queue intake payload
   * @param queueMode - Queue mode for the performer (ON or OFF)
   * @returns Created queue item document
   * @throws BadRequestException if validation fails
   * @throws HttpException if queue is full or duplicate key
   */
  async createQueueItem(
    intake: QueueIntakePayload,
    queueMode: QueueMode = QueueMode.ON
  ): Promise<QueueItemDocument> {
    // 1. Idempotency check - prevent duplicate processing
    const existingItem = await this.checkIdempotency(intake.idempotencyKey);
    if (existingItem) {
      this.logger.log(`Idempotency key ${intake.idempotencyKey} already exists, returning existing item`);
      return existingItem;
    }

    // 2. Validate payload
    this.validateIntakePayload(intake);

    // 3. Convert string IDs to ObjectId
    const performerId = new ObjectId(intake.performerId);
    const userId = new ObjectId(intake.userId);

    // 4. Mode-specific logic
    if (queueMode === QueueMode.OFF) {
      // Pass-through mode: auto-start and auto-finish immediately
      return this.createPassThroughItem(intake, performerId, userId);
    } else {
      // Queue mode ON: standard FIFO queue
      return this.createQueuedItem(intake, performerId, userId);
    }
  }

  /**
   * Get the position of a queue item
   * 
   * @param itemId - Queue item ID
   * @returns Position information including estimated wait time
   * @throws HttpException if item not found
   */
  async getQueuePosition(itemId: string): Promise<QueuePositionResponse> {
    const item = await this.queueItemModel.findById(itemId);
    
    if (!item) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.ITEM_NOT_FOUND,
          message: 'Queue item not found'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Count total items in queue for this performer
    const totalInQueue = await this.queueItemModel.countDocuments({
      performerId: item.performerId,
      status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] }
    });

    // Calculate estimated wait time based on items ahead and duration
    const estimatedWaitSeconds = await this.calculateEstimatedWait(
      item.performerId,
      item.position
    );

    return {
      itemId: item._id.toString(),
      performerId: item.performerId.toString(),
      position: item.position,
      totalInQueue,
      estimatedWaitSeconds,
      status: item.status
    };
  }

  /**
   * Start processing a queue item
   * 
   * Transitions item from CREATED to STARTED status.
   * Only valid for items in CREATED status and in queue mode (not pass-through).
   * 
   * @param itemId - Queue item ID
   * @returns Updated queue item
   * @throws HttpException if invalid state transition
   */
  async startItem(itemId: string): Promise<QueueItemDocument> {
    const item = await this.queueItemModel.findById(itemId);
    
    if (!item) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.ITEM_NOT_FOUND,
          message: 'Queue item not found'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Validate state transition
    if (item.status !== QueueItemStatus.CREATED) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.INVALID_STATE_TRANSITION,
          message: `Cannot start item in ${item.status} status. Item must be in created status.`
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Check if performer is already processing another item
    const activeItem = await this.queueItemModel.findOne({
      performerId: item.performerId,
      status: QueueItemStatus.STARTED,
      _id: { $ne: item._id }
    });

    if (activeItem) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.ALREADY_PROCESSING,
          message: 'Performer is already processing another queue item'
        },
        HttpStatus.CONFLICT
      );
    }

    // Update item status to STARTED
    item.status = QueueItemStatus.STARTED;
    item.startedAt = new Date();
    item.updatedAt = new Date();

    await item.save();

    this.logger.log(`Queue item ${itemId} started by performer ${item.performerId}`);

    // Emit event for notifications (would integrate with QueueEventService)
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_STARTED, item);

    return item;
  }

  /**
   * Complete a queue item
   * 
   * Transitions item from STARTED to FINISHED status.
   * Marks the item as ready for settlement (escrow release to performer).
   * 
   * Note: Actual escrow settlement should be handled by a separate wallet/escrow service.
   * This method only marks the item as ready for settlement.
   * 
   * @param itemId - Queue item ID
   * @returns Updated queue item
   * @throws HttpException if invalid state transition
   */
  async completeItem(itemId: string): Promise<QueueItemDocument> {
    const item = await this.queueItemModel.findById(itemId);
    
    if (!item) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.ITEM_NOT_FOUND,
          message: 'Queue item not found'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Validate state transition - can complete from STARTED or CREATED (pass-through)
    if (item.status !== QueueItemStatus.STARTED && !item.passThroughMode) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.INVALID_STATE_TRANSITION,
          message: `Cannot complete item in ${item.status} status. Item must be in started status.`
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Update item status to FINISHED
    item.status = QueueItemStatus.FINISHED;
    item.finishedAt = new Date();
    item.updatedAt = new Date();

    await item.save();

    this.logger.log(`Queue item ${itemId} completed by performer ${item.performerId}`);

    // Recalculate positions for remaining items in queue
    await this.recalculateQueuePositions(item.performerId);

    // Emit event for settlement processing
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_FINISHED, item);

    /**
     * TODO: Settlement Integration
     * In a complete implementation, this would trigger escrow settlement:
     * 
     * await this.escrowService.releaseHold(
     *   item.escrowTransactionId,
     *   item.performerId.toString()
     * );
     * 
     * item.settled = true;
     * item.settledAt = new Date();
     * item.settlementTransactionId = settlementTxId;
     * await item.save();
     */

    return item;
  }

  /**
   * Abandon a queue item
   * 
   * Marks item as abandoned due to disconnection, timeout, or other reason.
   * Abandoned items should typically be refunded to the user.
   * 
   * @param itemId - Queue item ID
   * @param reason - Reason for abandonment (optional)
   * @returns Updated queue item
   * @throws HttpException if item not found
   */
  async abandonItem(itemId: string, reason?: string): Promise<QueueItemDocument> {
    const item = await this.queueItemModel.findById(itemId);
    
    if (!item) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.ITEM_NOT_FOUND,
          message: 'Queue item not found'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Can abandon from CREATED or STARTED status only
    if (item.status !== QueueItemStatus.CREATED && item.status !== QueueItemStatus.STARTED) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.INVALID_STATE_TRANSITION,
          message: `Cannot abandon item in ${item.status} status. Item must be in created or started status.`
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Update item status to ABANDONED
    item.status = QueueItemStatus.ABANDONED;
    item.abandonedAt = new Date();
    item.updatedAt = new Date();
    
    if (reason) {
      item.refundReason = reason;
    }

    await item.save();

    this.logger.log(`Queue item ${itemId} abandoned: ${reason || 'no reason provided'}`);

    // Recalculate positions for remaining items
    await this.recalculateQueuePositions(item.performerId);

    // Emit event for refund processing
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_ABANDONED, item);

    /**
     * TODO: Refund Integration
     * In a complete implementation, this would trigger automatic refund:
     * 
     * await this.refundItem(itemId, RefundReason.PERFORMER_DISCONNECTED);
     */

    return item;
  }

  /**
   * Refund a queue item
   * 
   * Refunds the escrow hold back to the user.
   * Can be called from any state except already refunded.
   * 
   * @param itemId - Queue item ID
   * @param reason - Refund reason
   * @returns Updated queue item
   * @throws HttpException if item not found or already refunded
   */
  async refundItem(itemId: string, reason: RefundReason): Promise<QueueItemDocument> {
    const item = await this.queueItemModel.findById(itemId);
    
    if (!item) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.ITEM_NOT_FOUND,
          message: 'Queue item not found'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Cannot refund if already refunded or settled
    if (item.status === QueueItemStatus.REFUNDED) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.INVALID_STATE_TRANSITION,
          message: 'Item is already refunded'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (item.settled) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.INVALID_STATE_TRANSITION,
          message: 'Cannot refund settled item'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Update item status to REFUNDED
    item.status = QueueItemStatus.REFUNDED;
    item.refundedAt = new Date();
    item.refundReason = reason;
    item.updatedAt = new Date();

    await item.save();

    this.logger.log(`Queue item ${itemId} refunded: ${reason}`);

    // Recalculate positions for remaining items
    await this.recalculateQueuePositions(item.performerId);

    // Emit event for refund processing
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_REFUNDED, item);

    /**
     * TODO: Escrow Refund Integration
     * In a complete implementation, this would trigger escrow refund:
     * 
     * await this.escrowService.refundHold(
     *   item.escrowTransactionId,
     *   reason
     * );
     */

    return item;
  }

  /**
   * PRIVATE METHODS
   */

  /**
   * Check if idempotency key already exists
   */
  private async checkIdempotency(idempotencyKey: string): Promise<QueueItemDocument | null> {
    return this.queueItemModel.findOne({ idempotencyKey });
  }

  /**
   * Validate queue intake payload
   */
  private validateIntakePayload(intake: QueueIntakePayload): void {
    if (!intake.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }
    if (!intake.sourceFeature) {
      throw new BadRequestException('sourceFeature is required');
    }
    if (!intake.sourceEventId) {
      throw new BadRequestException('sourceEventId is required');
    }
    if (!intake.performerId) {
      throw new BadRequestException('performerId is required');
    }
    if (!intake.userId) {
      throw new BadRequestException('userId is required');
    }
    if (!intake.escrowTransactionId) {
      throw new BadRequestException('escrowTransactionId is required');
    }
    if (typeof intake.tokens !== 'number' || intake.tokens <= 0) {
      throw new BadRequestException('tokens must be a positive number');
    }
    if (!intake.title) {
      throw new BadRequestException('title is required');
    }
    if (!intake.description) {
      throw new BadRequestException('description is required');
    }
  }

  /**
   * Create a pass-through queue item (queue mode OFF)
   * Auto-starts and auto-finishes immediately
   */
  private async createPassThroughItem(
    intake: QueueIntakePayload,
    performerId: ObjectId,
    userId: ObjectId
  ): Promise<QueueItemDocument> {
    const now = new Date();

    const queueItem = new this.queueItemModel({
      idempotencyKey: intake.idempotencyKey,
      sourceFeature: intake.sourceFeature,
      sourceEventId: intake.sourceEventId,
      performerId,
      userId,
      escrowTransactionId: intake.escrowTransactionId,
      tokens: intake.tokens,
      title: intake.title,
      description: intake.description,
      durationSeconds: intake.durationSeconds,
      metadata: intake.metadata || {},
      status: QueueItemStatus.FINISHED, // Immediately finished in pass-through mode
      position: 0, // No position in pass-through mode
      passThroughMode: true,
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      finishedAt: now
    });

    await queueItem.save();

    this.logger.log(`Pass-through queue item created: ${queueItem._id} (mode: OFF)`);

    // In pass-through mode, item is immediately ready for settlement
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_CREATED, queueItem);
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_FINISHED, queueItem);

    return queueItem;
  }

  /**
   * Create a queued item (queue mode ON)
   * Adds to FIFO queue with proper position and depth check
   */
  private async createQueuedItem(
    intake: QueueIntakePayload,
    performerId: ObjectId,
    userId: ObjectId
  ): Promise<QueueItemDocument> {
    // Check queue depth limit
    const currentQueueDepth = await this.queueItemModel.countDocuments({
      performerId,
      status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] }
    });

    if (currentQueueDepth >= QUEUE_LIMITS.MAX_QUEUE_DEPTH) {
      throw new HttpException(
        {
          error: QUEUE_ERRORS.QUEUE_FULL,
          message: `Queue is full. Maximum ${QUEUE_LIMITS.MAX_QUEUE_DEPTH} items allowed.`
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // Calculate position (last position + 1)
    const lastItem = await this.queueItemModel
      .findOne({
        performerId,
        status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] }
      })
      .sort({ position: -1 });

    const position = lastItem ? lastItem.position + 1 : 1;

    const queueItem = new this.queueItemModel({
      idempotencyKey: intake.idempotencyKey,
      sourceFeature: intake.sourceFeature,
      sourceEventId: intake.sourceEventId,
      performerId,
      userId,
      escrowTransactionId: intake.escrowTransactionId,
      tokens: intake.tokens,
      title: intake.title,
      description: intake.description,
      durationSeconds: intake.durationSeconds,
      metadata: intake.metadata || {},
      status: QueueItemStatus.CREATED,
      position,
      passThroughMode: false
    });

    await queueItem.save();

    this.logger.log(`Queue item created: ${queueItem._id} at position ${position}`);

    // Emit event for notifications
    // await this.emitQueueEvent(QUEUE_EVENTS.ITEM_CREATED, queueItem);

    // If position is 3, emit third position notice
    if (position === 3) {
      // await this.emitQueueEvent(QUEUE_EVENTS.THIRD_POSITION_NOTICE, queueItem);
    }

    return queueItem;
  }

  /**
   * Recalculate queue positions after item removal/completion
   * Ensures FIFO ordering is maintained
   */
  private async recalculateQueuePositions(performerId: ObjectId): Promise<void> {
    const activeItems = await this.queueItemModel
      .find({
        performerId,
        status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] }
      })
      .sort({ createdAt: 1 }); // FIFO order based on creation time

    // Update positions sequentially
    for (let i = 0; i < activeItems.length; i++) {
      const newPosition = i + 1;
      if (activeItems[i].position !== newPosition) {
        activeItems[i].position = newPosition;
        activeItems[i].updatedAt = new Date();
        await activeItems[i].save();

        // Emit position update event
        // await this.emitQueueEvent(QUEUE_EVENTS.POSITION_UPDATED, activeItems[i]);
      }
    }

    this.logger.log(`Recalculated positions for performer ${performerId}, ${activeItems.length} items`);
  }

  /**
   * Calculate estimated wait time for a queue position
   */
  private async calculateEstimatedWait(
    performerId: ObjectId,
    position: number
  ): Promise<number | null> {
    if (position <= 1) {
      return 0; // First in queue or currently processing
    }

    // Get items ahead in queue
    const itemsAhead = await this.queueItemModel
      .find({
        performerId,
        status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] },
        position: { $lt: position }
      })
      .sort({ position: 1 });

    if (itemsAhead.length === 0) {
      return 0;
    }

    // Sum duration of items ahead
    let totalWaitSeconds = 0;
    for (const item of itemsAhead) {
      totalWaitSeconds += item.durationSeconds || QUEUE_LIMITS.DEFAULT_DURATION;
    }

    return totalWaitSeconds;
  }

  /**
   * Helper method to get queue depth for a performer
   * Useful for external callers to check queue status
   */
  async getQueueDepth(performerId: string): Promise<number> {
    return this.queueItemModel.countDocuments({
      performerId: new ObjectId(performerId),
      status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] }
    });
  }

  /**
   * Get all active queue items for a performer
   * Useful for displaying performer's current queue
   */
  async getPerformerQueue(performerId: string): Promise<QueueItemDocument[]> {
    return this.queueItemModel
      .find({
        performerId: new ObjectId(performerId),
        status: { $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED] }
      })
      .sort({ position: 1 });
  }

  /**
   * Get queue history for a user
   * Useful for displaying user's past queue items
   */
  async getUserQueueHistory(
    userId: string,
    limit = 20,
    skip = 0
  ): Promise<QueueItemDocument[]> {
    return this.queueItemModel
      .find({
        userId: new ObjectId(userId)
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }
}
