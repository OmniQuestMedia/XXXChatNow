/**
 * Wallet Rate Limiting Service
 * 
 * Enforces rate limits on wallet verification to prevent abuse.
 * Uses MongoDB for persistent rate limiting across restarts.
 */

import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { WalletVerificationAttempt, WalletVerificationAttemptDocument } from '../schemas';

// Rate limiting constants
const MAX_VERIFICATION_ATTEMPTS_PER_HOUR = 5;
const MAX_VERIFICATION_ATTEMPTS_PER_DAY = 10;

@Injectable()
export class WalletRateLimitService {
  private readonly logger = new Logger(WalletRateLimitService.name);

  constructor(
    @InjectModel(WalletVerificationAttempt.name)
    private readonly attemptModel: Model<WalletVerificationAttemptDocument>
  ) {}

  /**
   * Check if user has exceeded rate limit for verification attempts
   * 
   * @param userId - User ID to check
   * @throws HttpException if rate limit exceeded
   */
  async checkVerificationRateLimit(userId: ObjectId): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [hourlyAttempts, dailyAttempts] = await Promise.all([
      this.attemptModel.countDocuments({
        userId,
        createdAt: { $gte: oneHourAgo }
      }),
      this.attemptModel.countDocuments({
        userId,
        createdAt: { $gte: oneDayAgo }
      })
    ]);

    if (hourlyAttempts >= MAX_VERIFICATION_ATTEMPTS_PER_HOUR) {
      this.logger.warn(`User ${userId} exceeded hourly verification rate limit`);
      throw new HttpException(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `You have exceeded the maximum of ${MAX_VERIFICATION_ATTEMPTS_PER_HOUR} verification attempts per hour. Please try again later.`,
          resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (dailyAttempts >= MAX_VERIFICATION_ATTEMPTS_PER_DAY) {
      this.logger.warn(`User ${userId} exceeded daily verification rate limit`);
      throw new HttpException(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `You have exceeded the maximum of ${MAX_VERIFICATION_ATTEMPTS_PER_DAY} verification attempts per day. Please try again tomorrow.`,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  /**
   * Record a verification attempt
   */
  async recordAttempt(
    userId: ObjectId,
    status: 'pending' | 'success' | 'failed',
    metadata?: {
      failureReason?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.attemptModel.create({
      userId,
      status,
      failureReason: metadata?.failureReason,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    });

    this.logger.log(`Recorded ${status} verification attempt for user ${userId}`);
  }

  /**
   * Get verification attempt statistics for a user
   */
  async getAttemptStats(userId: ObjectId): Promise<{
    hourlyAttempts: number;
    dailyAttempts: number;
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [hourly, daily, total, successful, failed] = await Promise.all([
      this.attemptModel.countDocuments({
        userId,
        createdAt: { $gte: oneHourAgo }
      }),
      this.attemptModel.countDocuments({
        userId,
        createdAt: { $gte: oneDayAgo }
      }),
      this.attemptModel.countDocuments({ userId }),
      this.attemptModel.countDocuments({ userId, status: 'success' }),
      this.attemptModel.countDocuments({ userId, status: 'failed' })
    ]);

    return {
      hourlyAttempts: hourly,
      dailyAttempts: daily,
      totalAttempts: total,
      successfulAttempts: successful,
      failedAttempts: failed
    };
  }
}
