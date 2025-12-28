/**
 * Queue Rate Limit Service
 * 
 * Implements rate limiting for queue operations to prevent abuse and ensure fair resource allocation.
 * Uses Redis for distributed rate limiting across multiple instances.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { MAX_REQUESTS_PER_USER_PER_MINUTE, PERFORMANCE_QUEUE_ERRORS } from '../constants';

@Injectable()
export class QueueRateLimitService {
  private redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  /**
   * Check if user has exceeded rate limit for queue submissions
   * @param userId User identifier
   * @param limit Maximum requests allowed per minute (defaults to constant)
   * @returns true if within limit, throws exception if exceeded
   */
  async checkRateLimit(userId: string, limit: number = MAX_REQUESTS_PER_USER_PER_MINUTE): Promise<boolean> {
    const key = `queue:ratelimit:${userId}`;
    const currentMinute = Math.floor(Date.now() / 60000);
    const windowKey = `${key}:${currentMinute}`;

    try {
      // Get current count for this minute
      const count = await this.redis.incr(windowKey);

      // Set expiration on first increment (2 minutes to be safe)
      if (count === 1) {
        await this.redis.expire(windowKey, 120);
      }

      if (count > limit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Rate limit exceeded. Maximum ${limit} requests per minute allowed.`,
            error: PERFORMANCE_QUEUE_ERRORS.RATE_LIMIT_EXCEEDED
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // If Redis fails, allow the request but log the error
      console.error('Rate limit check failed:', error);
      return true;
    }
  }

  /**
   * Get current rate limit status for a user
   * @param userId User identifier
   * @returns Object with current count and remaining requests
   */
  async getRateLimitStatus(userId: string, limit: number = MAX_REQUESTS_PER_USER_PER_MINUTE): Promise<{
    current: number;
    remaining: number;
    resetAt: Date;
  }> {
    const key = `queue:ratelimit:${userId}`;
    const currentMinute = Math.floor(Date.now() / 60000);
    const windowKey = `${key}:${currentMinute}`;

    try {
      const count = await this.redis.get(windowKey);
      const current = count ? parseInt(count, 10) : 0;
      const remaining = Math.max(0, limit - current);
      const resetAt = new Date((currentMinute + 1) * 60000);

      return { current, remaining, resetAt };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { current: 0, remaining: limit, resetAt: new Date(Date.now() + 60000) };
    }
  }

  /**
   * Reset rate limit for a user (admin function)
   * @param userId User identifier
   */
  async resetRateLimit(userId: string): Promise<void> {
    const key = `queue:ratelimit:${userId}`;
    const currentMinute = Math.floor(Date.now() / 60000);
    const windowKey = `${key}:${currentMinute}`;

    try {
      await this.redis.del(windowKey);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }
}
