/**
 * SM-Payout Service
 * 
 * Manages all token debit/credit operations for slot machine.
 * Enforces: ONE immutable transaction per prize fulfillment.
 * 
 * Key Features:
 * - Idempotent operations
 * - Atomic transactions
 * - Complete audit trail
 * - Integration with Ledger API via SM-Ledger-Client
 * 
 * Security:
 * - All calculations server-side
 * - No PII in logs
 * - Integrity hashes for tamper detection
 * 
 * References:
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (Financial Operations)
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (Loyalty API Contract)
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  SMPayoutTransaction,
  SMPayoutTransactionDocument,
  TransactionType,
  TransactionStatus
} from '../schemas/SM-payout-transaction.schema';
import { SMledgerClientService } from './SM-ledger-client.service';

interface CreateTransactionParams {
  userId: ObjectId | string;
  performerId: ObjectId | string;
  type: TransactionType;
  amount: number;
  idempotencyKey: string;
  gameSessionId?: string;
  queueId?: string;
  spinId?: string;
  prizeData?: {
    symbols?: string[];
    multiplier?: number;
    payout?: number;
    isWin?: boolean;
  };
  metadata?: {
    reason: string;
    abandonmentNote?: string;
  };
}

@Injectable()
export class SMPayoutService {
  private readonly logger = new Logger(SMPayoutService.name);

  constructor(
    @InjectModel(SMPayoutTransaction.name)
    private readonly transactionModel: Model<SMPayoutTransactionDocument>,
    private readonly ledgerClient: SMledgerClientService
  ) {}

  /**
   * Process debit transaction (user pays)
   * MUST be idempotent
   */
  public async processDebit(params: CreateTransactionParams): Promise<SMPayoutTransactionDocument> {
    // Check idempotency
    const existing = await this.checkIdempotency(params.idempotencyKey);
    if (existing) {
      this.logger.log(`Debit transaction already processed: ${existing.transactionId}`);
      return existing;
    }

    // Validate amount
    if (params.amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
    }

    // Create transaction record (PENDING)
    const transactionId = this.generateTransactionId();
    const transaction = await this.transactionModel.create({
      transactionId,
      idempotencyKey: params.idempotencyKey,
      userId: params.userId,
      performerId: params.performerId,
      type: TransactionType.DEBIT,
      status: TransactionStatus.PENDING,
      amount: params.amount,
      gameSessionId: params.gameSessionId,
      queueId: params.queueId,
      spinId: params.spinId,
      metadata: params.metadata,
      initiatedAt: new Date()
    });

    try {
      // Call Ledger API to debit balance
      transaction.status = TransactionStatus.PROCESSING;
      await transaction.save();

      const ledgerResponse = await this.ledgerClient.debit({
        userId: params.userId,
        amount: params.amount,
        reason: params.metadata?.reason || 'slot_machine_debit',
        transactionId,
        idempotencyKey: params.idempotencyKey
      });

      if (ledgerResponse.success) {
        // Update transaction as completed
        transaction.status = TransactionStatus.COMPLETED;
        transaction.balanceAfter = ledgerResponse.newBalance;
        transaction.balanceBefore = ledgerResponse.newBalance + params.amount;
        transaction.ledgerTransactionId = ledgerResponse.transactionId;
        transaction.ledgerResponse = {
          success: true,
          responseCode: ledgerResponse.responseCode,
          message: ledgerResponse.message,
          timestamp: new Date()
        };
        transaction.processedAt = new Date();
        transaction.completedAt = new Date();
        transaction.durationMs = Date.now() - transaction.initiatedAt.getTime();
        transaction.integrityHash = this.generateIntegrityHash(transaction);
        await transaction.save();

        this.logger.log(`Debit completed: ${transactionId}, Amount: ${params.amount}`);
        return transaction;
      } else {
        // Ledger rejected transaction
        transaction.status = TransactionStatus.FAILED;
        transaction.ledgerResponse = {
          success: false,
          responseCode: ledgerResponse.responseCode,
          message: ledgerResponse.message || ledgerResponse.error,
          timestamp: new Date()
        };
        transaction.processedAt = new Date();
        await transaction.save();

        throw new HttpException(
          {
            error: ledgerResponse.error || 'DEBIT_FAILED',
            message: ledgerResponse.message || 'Failed to process debit'
          },
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      // Mark transaction as failed
      transaction.status = TransactionStatus.FAILED;
      transaction.metadata = {
        ...transaction.metadata,
        errorDetails: error.message
      };
      transaction.processedAt = new Date();
      await transaction.save();

      this.logger.error(`Debit failed: ${transactionId}`, error.stack);
      throw error;
    }
  }

  /**
   * Process credit transaction (user wins)
   * MUST be idempotent
   */
  public async processCredit(params: CreateTransactionParams): Promise<SMPayoutTransactionDocument> {
    // Check idempotency
    const existing = await this.checkIdempotency(params.idempotencyKey);
    if (existing) {
      this.logger.log(`Credit transaction already processed: ${existing.transactionId}`);
      return existing;
    }

    // Validate amount
    if (params.amount < 0) {
      throw new BadRequestException('Credit amount cannot be negative');
    }

    // Create transaction record (PENDING)
    const transactionId = this.generateTransactionId();
    const transaction = await this.transactionModel.create({
      transactionId,
      idempotencyKey: params.idempotencyKey,
      userId: params.userId,
      performerId: params.performerId,
      type: TransactionType.CREDIT,
      status: TransactionStatus.PENDING,
      amount: params.amount,
      gameSessionId: params.gameSessionId,
      queueId: params.queueId,
      spinId: params.spinId,
      prizeData: params.prizeData,
      metadata: params.metadata,
      initiatedAt: new Date()
    });

    try {
      // Call Ledger API to credit balance
      transaction.status = TransactionStatus.PROCESSING;
      await transaction.save();

      const ledgerResponse = await this.ledgerClient.credit({
        userId: params.userId,
        amount: params.amount,
        reason: params.metadata?.reason || 'slot_machine_win',
        transactionId,
        idempotencyKey: params.idempotencyKey,
        metadata: {
          spinId: params.spinId,
          symbols: params.prizeData?.symbols,
          multiplier: params.prizeData?.multiplier
        }
      });

      if (ledgerResponse.success) {
        // Update transaction as completed
        transaction.status = TransactionStatus.COMPLETED;
        transaction.balanceAfter = ledgerResponse.newBalance;
        transaction.balanceBefore = ledgerResponse.newBalance - params.amount;
        transaction.ledgerTransactionId = ledgerResponse.transactionId;
        transaction.ledgerResponse = {
          success: true,
          responseCode: ledgerResponse.responseCode,
          message: ledgerResponse.message,
          timestamp: new Date()
        };
        transaction.processedAt = new Date();
        transaction.completedAt = new Date();
        transaction.durationMs = Date.now() - transaction.initiatedAt.getTime();
        transaction.integrityHash = this.generateIntegrityHash(transaction);
        await transaction.save();

        this.logger.log(`Credit completed: ${transactionId}, Amount: ${params.amount}`);
        return transaction;
      } else {
        // Ledger rejected transaction
        transaction.status = TransactionStatus.FAILED;
        transaction.ledgerResponse = {
          success: false,
          responseCode: ledgerResponse.responseCode,
          message: ledgerResponse.message || ledgerResponse.error,
          timestamp: new Date()
        };
        transaction.processedAt = new Date();
        await transaction.save();

        throw new HttpException(
          {
            error: ledgerResponse.error || 'CREDIT_FAILED',
            message: ledgerResponse.message || 'Failed to process credit'
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      // Mark transaction as failed
      transaction.status = TransactionStatus.FAILED;
      transaction.metadata = {
        ...transaction.metadata,
        errorDetails: error.message
      };
      transaction.processedAt = new Date();
      await transaction.save();

      this.logger.error(`Credit failed: ${transactionId}`, error.stack);
      throw error;
    }
  }

  /**
   * Process refund transaction
   * Used when user abandons queue or game fails
   */
  public async processRefund(params: CreateTransactionParams): Promise<SMPayoutTransactionDocument> {
    // Check idempotency
    const existing = await this.checkIdempotency(params.idempotencyKey);
    if (existing) {
      this.logger.log(`Refund transaction already processed: ${existing.transactionId}`);
      return existing;
    }

    // Refund is essentially a credit with different reason
    return this.processCredit({
      ...params,
      type: TransactionType.REFUND,
      metadata: {
        ...params.metadata,
        reason: params.metadata?.reason || 'slot_machine_refund'
      }
    });
  }

  /**
   * Get transaction by ID
   */
  public async getTransaction(transactionId: string): Promise<SMPayoutTransactionDocument> {
    return this.transactionModel.findOne({ transactionId }).exec();
  }

  /**
   * Get transactions for a user
   */
  public async getUserTransactions(
    userId: ObjectId | string,
    limit = 50,
    offset = 0
  ): Promise<{ transactions: SMPayoutTransactionDocument[]; total: number }> {
    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .exec(),
      this.transactionModel.countDocuments({ userId })
    ]);

    return { transactions, total };
  }

  /**
   * Get transactions for a game session
   */
  public async getSessionTransactions(gameSessionId: string): Promise<SMPayoutTransactionDocument[]> {
    return this.transactionModel
      .find({ gameSessionId })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Check idempotency - return existing transaction if already processed
   */
  private async checkIdempotency(idempotencyKey: string): Promise<SMPayoutTransactionDocument | null> {
    return this.transactionModel.findOne({ idempotencyKey }).exec();
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Generate integrity hash for transaction
   * Used for tamper detection
   */
  private generateIntegrityHash(transaction: SMPayoutTransactionDocument): string {
    const data = `${transaction.transactionId}:${transaction.userId}:${transaction.amount}:${transaction.type}:${transaction.completedAt?.toISOString()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify transaction integrity
   */
  public verifyIntegrity(transaction: SMPayoutTransactionDocument): boolean {
    if (!transaction.integrityHash) {
      return false;
    }
    const expectedHash = this.generateIntegrityHash(transaction);
    return expectedHash === transaction.integrityHash;
  }
}
