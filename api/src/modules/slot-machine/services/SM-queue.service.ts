/**
 * SM-Queue Service
 * 
 * Manages per-model queues for slot machine games.
 * Enforces: Only ONE active game per model at any time.
 * 
 * Key Features:
 * - FIFO queue per model (performerId)
 * - Configurable queue capacity with overflow handling
 * - Automatic refunds for abandoned/overflow entries
 * - Position tracking and waiting time estimates
 * 
 * Security:
 * - Idempotent operations
 * - Complete audit trail
 * - No PII in logs
 * 
 * References:
 * - Problem statement: "Only one SM task active at any time per model"
 * - Problem statement: "N users queued per model, overflow/rope-drop with refunds"
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  SMQueueEntry,
  SMQueueEntryDocument,
  QueueEntryStatus
} from '../schemas/SM-queue-entry.schema';
import {
  SMGameSession,
  SMGameSessionDocument,
  GameSessionStatus
} from '../schemas/SM-game-session.schema';
import { SMPayoutService } from './SM-payout.service';
import { SMledgerClientService } from './SM-ledger-client.service';
import { TransactionType } from '../schemas/SM-payout-transaction.schema';

interface JoinQueueParams {
  userId: ObjectId | string;
  performerId: ObjectId | string;
  entryFee: number;
  idempotencyKey: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

interface QueueStatus {
  performerId: ObjectId | string;
  queueLength: number;
  activeSession: SMGameSessionDocument | null;
  userPosition: number | null; // null if user not in queue
  estimatedWaitTimeMs: number | null;
  canJoin: boolean;
  reason?: string;
}

@Injectable()
export class SMQueueService {
  private readonly logger = new Logger(SMQueueService.name);

  // Configuration (should be in config service in production)
  private readonly MAX_QUEUE_SIZE = 10;          // Max users per model queue
  private readonly QUEUE_TIMEOUT_MS = 600000;    // 10 minutes
  private readonly AVG_GAME_DURATION_MS = 120000; // 2 minutes (estimated)

  constructor(
    @InjectModel(SMQueueEntry.name)
    private readonly queueEntryModel: Model<SMQueueEntryDocument>,
    @InjectModel(SMGameSession.name)
    private readonly gameSessionModel: Model<SMGameSessionDocument>,
    @Inject(forwardRef(() => SMPayoutService))
    private readonly payoutService: SMPayoutService,
    @Inject(forwardRef(() => SMledgerClientService))
    private readonly ledgerClient: SMledgerClientService
  ) {}

  /**
   * Join queue for a specific model
   * Returns queue entry or throws error if queue is full/Ledger is down
   */
  public async joinQueue(params: JoinQueueParams): Promise<SMQueueEntryDocument> {
    // 1. Check if Ledger is healthy - MUST NOT start new games if down
    const ledgerHealth = await this.ledgerClient.checkHealth();
    if (!ledgerHealth.isHealthy) {
      throw new HttpException(
        {
          error: 'LEDGER_UNAVAILABLE',
          message: 'Slot machine is temporarily unavailable. Please try again later.',
          nextRetryAt: ledgerHealth.nextRetryAt
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // 2. Check idempotency
    const existing = await this.queueEntryModel
      .findOne({ idempotencyKey: { $eq: params.idempotencyKey } })
      .exec();
    if (existing) {
      this.logger.log(`User already in queue: ${existing.queueId}`);
      return existing;
    }

    // 3. Check if user already in queue for this model
    const userInQueue = await this.queueEntryModel
      .findOne({
        userId: params.userId,
        performerId: params.performerId,
        status: { $in: [QueueEntryStatus.WAITING, QueueEntryStatus.ACTIVE] }
      })
      .exec();

    if (userInQueue) {
      throw new BadRequestException('You are already in queue for this model');
    }

    // 4. Get current queue size
    const queueSize = await this.queueEntryModel.countDocuments({
      performerId: params.performerId,
      status: QueueEntryStatus.WAITING
    });

    // 5. Check overflow - reject if queue is full
    if (queueSize >= this.MAX_QUEUE_SIZE) {
      throw new HttpException(
        {
          error: 'QUEUE_FULL',
          message: 'Queue is currently full. Please try again later.',
          queueSize,
          maxQueueSize: this.MAX_QUEUE_SIZE
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // 6. Process entry fee debit BEFORE adding to queue
    const queueId = this.generateQueueId();
    
    try {
      const debitTransaction = await this.payoutService.processDebit({
        userId: params.userId,
        performerId: params.performerId,
        type: TransactionType.DEBIT,
        amount: params.entryFee,
        idempotencyKey: params.idempotencyKey,
        queueId,
        metadata: {
          reason: 'slot_machine_queue_entry'
        }
      });

      // 7. Create queue entry AFTER successful payment
      const queueEntry = await this.queueEntryModel.create({
        userId: params.userId,
        performerId: params.performerId,
        queueId,
        idempotencyKey: params.idempotencyKey,
        position: queueSize, // 0-based position
        entryFee: params.entryFee,
        status: QueueEntryStatus.WAITING,
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + this.QUEUE_TIMEOUT_MS),
        ledgerTransactionId: debitTransaction.transactionId,
        metadata: params.metadata
      });

      this.logger.log(`User joined queue: ${queueId}, Position: ${queueSize}, Model: ${params.performerId}`);
      return queueEntry;
    } catch (error) {
      this.logger.error(`Failed to join queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Leave queue (user abandons)
   * Issues refund for entry fee
   */
  public async leaveQueue(
    userId: ObjectId | string,
    performerId: ObjectId | string,
    reason = 'user_left'
  ): Promise<void> {
    const queueEntry = await this.queueEntryModel
      .findOne({
        userId: { $eq: userId },
        performerId: { $eq: performerId },
        status: QueueEntryStatus.WAITING
      })
      .exec();

    if (!queueEntry) {
      throw new BadRequestException('You are not in queue for this model');
    }

    // Process refund
    const refundIdempotencyKey = `refund_${queueEntry.queueId}_${Date.now()}`;
    
    try {
      const refundTransaction = await this.payoutService.processRefund({
        userId,
        performerId,
        type: TransactionType.REFUND,
        amount: queueEntry.entryFee,
        idempotencyKey: refundIdempotencyKey,
        queueId: queueEntry.queueId,
        metadata: {
          reason: 'slot_machine_queue_abandonment',
          abandonmentNote: reason
        }
      });

      // Update queue entry
      queueEntry.status = QueueEntryStatus.REFUNDED;
      queueEntry.completedAt = new Date();
      queueEntry.refundTransactionId = refundTransaction.transactionId;
      queueEntry.metadata = {
        ...queueEntry.metadata,
        abandonmentReason: reason
      };
      await queueEntry.save();

      // Rebalance queue positions
      await this.rebalanceQueuePositions(performerId);

      this.logger.log(`User left queue: ${queueEntry.queueId}, Refunded: ${queueEntry.entryFee}`);
    } catch (error) {
      this.logger.error(`Failed to leave queue: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get next user from queue and start game session
   * Enforces: Only ONE active session per model
   */
  public async startNextGame(performerId: ObjectId | string): Promise<SMGameSessionDocument | null> {
    // 1. Check if there's already an active session for this model
    const activeSession = await this.gameSessionModel
      .findOne({
        performerId,
        status: { $in: [GameSessionStatus.INITIALIZING, GameSessionStatus.ACTIVE] }
      })
      .exec();

    if (activeSession) {
      this.logger.warn(`Cannot start new game - active session exists: ${activeSession.sessionId}`);
      return null;
    }

    // 2. Get next user from queue (FIFO)
    const nextEntry = await this.queueEntryModel
      .findOne({
        performerId,
        status: QueueEntryStatus.WAITING
      })
      .sort({ position: 1 })
      .exec();

    if (!nextEntry) {
      this.logger.log(`No users in queue for model: ${performerId}`);
      return null;
    }

    // 3. Create game session
    const sessionId = this.generateSessionId();
    const gameSession = await this.gameSessionModel.create({
      sessionId,
      userId: nextEntry.userId,
      performerId,
      queueId: nextEntry.queueId,
      status: GameSessionStatus.INITIALIZING,
      betAmount: nextEntry.entryFee, // Use entry fee as bet amount
      startedAt: new Date(),
      ledgerStatus: {
        isHealthy: true,
        lastCheckAt: new Date(),
        failureCount: 0
      }
    });

    // 4. Update queue entry to ACTIVE
    nextEntry.status = QueueEntryStatus.ACTIVE;
    nextEntry.startedAt = new Date();
    nextEntry.gameSessionId = sessionId;
    await nextEntry.save();

    // 5. Update session to ACTIVE
    gameSession.status = GameSessionStatus.ACTIVE;
    await gameSession.save();

    this.logger.log(`Game session started: ${sessionId}, User: ${nextEntry.userId}, Model: ${performerId}`);
    return gameSession;
  }

  /**
   * Get queue status for a model
   */
  public async getQueueStatus(
    performerId: ObjectId | string,
    userId?: ObjectId | string
  ): Promise<QueueStatus> {
    // Get active session
    const activeSession = await this.gameSessionModel
      .findOne({
        performerId,
        status: { $in: [GameSessionStatus.INITIALIZING, GameSessionStatus.ACTIVE] }
      })
      .exec();

    // Get queue entries
    const queueEntries = await this.queueEntryModel
      .find({
        performerId,
        status: QueueEntryStatus.WAITING
      })
      .sort({ position: 1 })
      .exec();

    const queueLength = queueEntries.length;

    // Find user position if userId provided
    let userPosition: number | null = null;
    let estimatedWaitTimeMs: number | null = null;

    if (userId) {
      const userEntry = queueEntries.find(
        entry => entry.userId.toString() === userId.toString()
      );
      if (userEntry) {
        userPosition = userEntry.position;
        // Estimate: (position + 1 if game active) * avg game duration
        const gamesAhead = activeSession ? userPosition + 1 : userPosition;
        estimatedWaitTimeMs = gamesAhead * this.AVG_GAME_DURATION_MS;
      }
    }

    // Check if user can join
    const canJoin = queueLength < this.MAX_QUEUE_SIZE;
    const reason = canJoin ? undefined : 'Queue is full';

    return {
      performerId,
      queueLength,
      activeSession,
      userPosition,
      estimatedWaitTimeMs,
      canJoin,
      reason
    };
  }

  /**
   * Clean up expired queue entries
   * Should be called periodically (e.g., via cron job)
   */
  public async cleanupExpiredEntries(): Promise<number> {
    const now = new Date();
    const expiredEntries = await this.queueEntryModel
      .find({
        status: QueueEntryStatus.WAITING,
        expiresAt: { $lte: now }
      })
      .exec();

    let refundedCount = 0;

    for (const entry of expiredEntries) {
      try {
        // Issue refund
        const refundIdempotencyKey = `refund_expired_${entry.queueId}_${Date.now()}`;
        const refundTransaction = await this.payoutService.processRefund({
          userId: entry.userId,
          performerId: entry.performerId,
          type: TransactionType.REFUND,
          amount: entry.entryFee,
          idempotencyKey: refundIdempotencyKey,
          queueId: entry.queueId,
          metadata: {
            reason: 'slot_machine_queue_timeout',
            abandonmentNote: 'Queue entry expired'
          }
        });

        // Update entry
        entry.status = QueueEntryStatus.EXPIRED;
        entry.completedAt = new Date();
        entry.refundTransactionId = refundTransaction.transactionId;
        entry.metadata = {
          ...entry.metadata,
          abandonmentReason: 'timeout'
        };
        await entry.save();

        refundedCount++;
      } catch (error) {
        this.logger.error(`Failed to refund expired entry: ${entry.queueId}`, error.stack);
      }
    }

    if (refundedCount > 0) {
      this.logger.log(`Cleaned up ${refundedCount} expired queue entries`);
    }

    return refundedCount;
  }

  /**
   * Rebalance queue positions after user leaves
   */
  private async rebalanceQueuePositions(performerId: ObjectId | string): Promise<void> {
    const queueEntries = await this.queueEntryModel
      .find({
        performerId,
        status: QueueEntryStatus.WAITING
      })
      .sort({ position: 1 })
      .exec();

    // Update positions sequentially
    for (let i = 0; i < queueEntries.length; i++) {
      queueEntries[i].position = i;
      await queueEntries[i].save();
    }
  }

  /**
   * Generate unique queue ID
   */
  private generateQueueId(): string {
    return `queue_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }
}
