/**
 * Slot Machine Core Service
 * 
 * CRITICAL: All game logic and reward calculations happen server-side.
 * NEVER trust client input for outcomes or payouts.
 * 
 * Security Features:
 * - Idempotency key enforcement
 * - Atomic balance operations
 * - Race condition prevention
 * - Complete audit trail
 * - No PII in logs
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (Core Functionality)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (All security sections)
 */

import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { ObjectId } from 'mongodb';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { UserService } from 'src/modules/user/services';
import {
  SlotMachineTransaction,
  SlotMachineTransactionDocument
} from '../schemas';
import { SlotMachineRNGService } from './slot-machine-rng.service';
import { SlotMachineConfigService } from './slot-machine-config.service';
import { SlotMachineRateLimitService } from './slot-machine-rate-limit.service';
import {
  SLOT_MACHINE_ERRORS,
  SPIN_STATUS,
  SLOT_MACHINE_CHANNEL,
  SLOT_MACHINE_EVENT
} from '../constants';

@Injectable()
export class SlotMachineService {
  constructor(
    @InjectModel(SlotMachineTransaction.name)
    private readonly transactionModel: Model<SlotMachineTransactionDocument>,
    private readonly rngService: SlotMachineRNGService,
    private readonly configService: SlotMachineConfigService,
    private readonly rateLimitService: SlotMachineRateLimitService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => QueueEventService))
    private readonly queueEventService: QueueEventService
  ) {}

  /**
   * Process a slot machine spin
   * 
   * This is the main entry point for spin operations.
   * All security checks and validations happen here.
   * 
   * @param userId - Authenticated user ID from session
   * @param betAmount - Bet amount in loyalty points
   * @param idempotencyKey - Unique key to prevent duplicate spins
   * @param metadata - Request metadata (IP, user agent, session)
   * @returns Transaction with spin result
   */
  public async spin(
    userId: ObjectId | string,
    betAmount: number,
    idempotencyKey: string,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    } = {}
  ): Promise<SlotMachineTransactionDocument> {
    // 1. Idempotency check - prevent duplicate spins
    const existingTransaction = await this.checkIdempotency(idempotencyKey);
    if (existingTransaction) {
      return existingTransaction;
    }

    // 2. Get active configuration
    const config = await this.configService.getActiveConfig();
    if (!config) {
      throw new HttpException(
        {
          error: SLOT_MACHINE_ERRORS.CONFIG_NOT_FOUND,
          message: 'Slot machine configuration not found'
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // 3. Validate bet amount matches configuration
    if (betAmount !== config.spinCost) {
      throw new BadRequestException({
        error: SLOT_MACHINE_ERRORS.INVALID_BET,
        message: `Invalid bet amount. Expected ${config.spinCost}, got ${betAmount}`
      });
    }

    // 4. Rate limit check - 100 spins per hour
    await this.rateLimitService.checkRateLimit(userId, config.maxSpinsPerHour);

    // 5. TODO: Age and jurisdiction compliance checks
    // await this.checkAgeCompliance(userId);
    // await this.checkJurisdictionCompliance(userId);

    // 6. Get user balance (TODO: integrate with RedRoomRewards API)
    const user = await this.userService.findById(userId as string);
    if (!user) {
      throw new BadRequestException({
        error: SLOT_MACHINE_ERRORS.USER_NOT_FOUND,
        message: 'User not found'
      });
    }

    const currentBalance = user.balance || 0;

    // 7. Check sufficient balance
    if (currentBalance < betAmount) {
      throw new HttpException(
        {
          error: SLOT_MACHINE_ERRORS.INSUFFICIENT_BALANCE,
          message: 'Insufficient balance for spin',
          currentBalance,
          required: betAmount
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // 8. Generate spin result using CSPRNG
    const spinId = this.rngService.generateSpinId();
    const symbolResults = this.rngService.generateSpinResult(config.symbols);
    const symbolIds = symbolResults.map(s => s.id);

    // 9. Calculate payout (server-side only, never trust client)
    const { isWin, payout, multiplier } = this.calculatePayout(
      symbolIds,
      config.symbols,
      betAmount
    );

    // 10. Calculate new balance
    const balanceAfter = currentBalance - betAmount + payout;

    // 11. Create transaction record with integrity hash
    const transactionData = {
      spinId,
      userId,
      idempotencyKey,
      betAmount,
      resultSymbols: symbolIds,
      isWin,
      payout,
      multiplier,
      balanceBefore: currentBalance,
      balanceAfter,
      status: SPIN_STATUS.PENDING,
      configId: config._id,
      serverTimestamp: new Date(),
      ...metadata
    };

    const integrityHash = this.rngService.generateIntegrityHash(transactionData);
    transactionData['integrityHash'] = integrityHash;

    // 12. Atomic database transaction to prevent race conditions
    const session = await this.transactionModel.db.startSession();
    let transaction: SlotMachineTransactionDocument;

    try {
      await session.withTransaction(async () => {
        // Create transaction record
        const [createdTransaction] = await this.transactionModel.create([transactionData], { session });
        transaction = createdTransaction;

        // TODO: Deduct balance via RedRoomRewards API with idempotency
        // await this.loyaltyService.deduct({
        //   userId,
        //   amount: betAmount,
        //   reason: 'slot_machine_spin',
        //   transactionId: spinId,
        //   idempotencyKey
        // });

        // For now, update user balance directly using existing method
        await this.userService.increaseBalance(
          userId as string,
          -betAmount,
          true
        );

        // If win, credit payout
        if (isWin && payout > 0) {
          // TODO: Credit via RedRoomRewards API with idempotency
          // await this.loyaltyService.credit({
          //   userId,
          //   amount: payout,
          //   reason: 'slot_machine_win',
          //   transactionId: spinId,
          //   metadata: { symbols: symbolIds, multiplier }
          // });

          await this.userService.increaseBalance(
            userId as string,
            payout,
            true
          );
        }

        // Update transaction status
        transaction.status = SPIN_STATUS.COMPLETED;
        await transaction.save({ session });
      });
    } catch (error) {
      // Mark transaction as failed
      if (transaction) {
        transaction.status = SPIN_STATUS.FAILED;
        await transaction.save();
      }
      throw error;
    } finally {
      await session.endSession();
    }

    // 13. Emit event for analytics and audit (no PII in event)
    await this.queueEventService.publish(
      new QueueEvent({
        channel: SLOT_MACHINE_CHANNEL,
        eventName: SLOT_MACHINE_EVENT.SPIN_COMPLETED,
        data: {
          spinId,
          userId: userId.toString(),
          isWin,
          payout,
          betAmount
        }
      })
    );

    // 14. Check for anomalies
    const anomalies = await this.rateLimitService.detectAnomalies(userId);
    if (anomalies.rapidSpinning || anomalies.unusualWinRate) {
      // TODO: Alert security team through proper security monitoring system
      // This should integrate with your security incident management system
      // Examples: PagerDuty, Datadog, Sentry, or internal SIEM
      await this.queueEventService.publish(
        new QueueEvent({
          channel: 'SECURITY_ALERTS',
          eventName: 'ANOMALY_DETECTED',
          data: {
            userId: userId.toString(),
            anomalyType: anomalies.rapidSpinning ? 'rapid_spinning' : 'unusual_win_rate',
            timestamp: new Date().toISOString()
          }
        })
      );
    }

    return transaction;
  }

  /**
   * Check if idempotency key already used
   * Prevents duplicate spins
   */
  private async checkIdempotency(
    idempotencyKey: string
  ): Promise<SlotMachineTransactionDocument | null> {
    return this.transactionModel.findOne({ idempotencyKey }).lean();
  }

  /**
   * Calculate payout based on symbol combination
   * Server-side only, never trust client calculation
   */
  private calculatePayout(
    symbolIds: string[],
    symbols: Array<{ id: string; rarity: number; payout_3x: number }>,
    betAmount: number
  ): { isWin: boolean; payout: number; multiplier: number } {
    // Check if all 3 symbols match
    if (symbolIds[0] === symbolIds[1] && symbolIds[1] === symbolIds[2]) {
      const symbol = symbols.find(s => s.id === symbolIds[0]);
      if (symbol) {
        return {
          isWin: true,
          payout: symbol.payout_3x,
          multiplier: symbol.payout_3x / betAmount
        };
      }
    }

    // No win
    return {
      isWin: false,
      payout: 0,
      multiplier: 0
    };
  }

  /**
   * Get spin history for user
   */
  public async getHistory(
    userId: ObjectId | string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: SlotMachineTransactionDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      this.transactionModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments({ userId })
    ]);

    return { data, total };
  }

  /**
   * Get transaction by spin ID
   */
  public async getTransactionBySpinId(
    spinId: string
  ): Promise<SlotMachineTransactionDocument> {
    return this.transactionModel.findOne({ spinId }).lean();
  }
}
