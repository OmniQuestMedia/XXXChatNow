/**
 * Slot Machine Rate Limiting Service
 * 
 * Enforces rate limits to prevent abuse (100 spins/hour/user).
 * Uses MongoDB for persistent rate limiting across restarts.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (Security Requirements - Rate Limiting)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (Rate limiting on sensitive operations)
 */

import {
  Injectable,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { SlotMachineTransaction, SlotMachineTransactionDocument } from '../schemas';
import { SLOT_MACHINE_ERRORS, MAX_SPINS_PER_HOUR } from '../constants';

@Injectable()
export class SlotMachineRateLimitService {
  constructor(
    @InjectModel(SlotMachineTransaction.name)
    private readonly transactionModel: Model<SlotMachineTransactionDocument>
  ) {}

  /**
   * Check if user has exceeded rate limit
   * Counts spins in the last hour
   * 
   * @param userId - User ID to check
   * @param maxSpins - Maximum spins allowed (from config)
   * @throws HttpException if rate limit exceeded
   */
  public async checkRateLimit(
    userId: ObjectId | string,
    maxSpins: number = MAX_SPINS_PER_HOUR
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const spinCount = await this.transactionModel.countDocuments({
      userId: userId,
      createdAt: { $gte: oneHourAgo },
      status: { $in: ['pending', 'completed'] } // Don't count failed/refunded spins
    });

    if (spinCount >= maxSpins) {
      const resetTime = new Date(
        (await this.getOldestSpinInWindow(userId, oneHourAgo)).getTime() + 60 * 60 * 1000
      );

      throw new HttpException(
        {
          error: SLOT_MACHINE_ERRORS.RATE_LIMIT_EXCEEDED,
          message: `You have exceeded the maximum of ${maxSpins} spins per hour. Please try again later.`,
          resetTime: resetTime.toISOString(),
          spinsUsed: spinCount,
          spinsLimit: maxSpins
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  /**
   * Get the oldest spin timestamp in the current window
   */
  private async getOldestSpinInWindow(
    userId: ObjectId | string,
    since: Date
  ): Promise<Date> {
    const oldestSpin = await this.transactionModel
      .findOne({
        userId: userId,
        createdAt: { $gte: since },
        status: { $in: ['pending', 'completed'] }
      })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean();

    return oldestSpin ? oldestSpin.createdAt : new Date();
  }

  /**
   * Get remaining spins in current window
   */
  public async getRemainingSpins(
    userId: ObjectId | string,
    maxSpins: number = MAX_SPINS_PER_HOUR
  ): Promise<{ remaining: number; used: number; resetTime: Date }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const spinCount = await this.transactionModel.countDocuments({
      userId: userId,
      createdAt: { $gte: oneHourAgo },
      status: { $in: ['pending', 'completed'] }
    });

    const remaining = Math.max(0, maxSpins - spinCount);
    const resetTime = spinCount > 0
      ? new Date((await this.getOldestSpinInWindow(userId, oneHourAgo)).getTime() + 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    return {
      remaining,
      used: spinCount,
      resetTime
    };
  }

  /**
   * Get anomaly detection flags for suspicious patterns
   * Used for fraud detection
   */
  public async detectAnomalies(userId: ObjectId | string): Promise<{
    rapidSpinning: boolean;
    unusualWinRate: boolean;
  }> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Check for rapid spinning (more than 50 spins in 5 minutes)
    const recentSpins = await this.transactionModel.countDocuments({
      userId: userId,
      createdAt: { $gte: fiveMinutesAgo }
    });

    const rapidSpinning = recentSpins > 50;

    // Check win rate in last 100 spins
    const last100Spins = await this.transactionModel
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('isWin')
      .lean();

    const wins = last100Spins.filter(s => s.isWin).length;
    const winRate = last100Spins.length > 0 ? wins / last100Spins.length : 0;

    // Flag if win rate significantly exceeds expected RTP (e.g., > 99%)
    const unusualWinRate = winRate > 0.99 && last100Spins.length >= 20;

    return {
      rapidSpinning,
      unusualWinRate
    };
  }
}
