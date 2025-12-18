import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { TokenLot, TokenLotType } from './entities/token-lot.entity';
import { TokenTransaction, TokenLotUsage } from './entities/token-transaction.entity';
import { AwardTokensDto } from './dto/award-tokens.dto';
import { SpendTokensDto } from './dto/spend-tokens.dto';
import { addHours, nowET } from '../../common/utils/timezone.util';
import { PolicyService } from '../policy/policy.service';

interface WalletBalance {
  totalTokens: number;
  breakdown: {
    promoBonus: number;
    membershipMonthly: number;
    purchased: number;
  };
  activeLots: number;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(TokenLot)
    private tokenLotRepository: Repository<TokenLot>,
    @InjectRepository(TokenTransaction)
    private tokenTransactionRepository: Repository<TokenTransaction>,
    private dataSource: DataSource,
    private policyService: PolicyService,
  ) {}

  /**
   * Award tokens to a user (creates a new lot)
   * Server-authoritative - only admin/system can call this
   */
  async awardTokens(awardTokensDto: AwardTokensDto): Promise<TokenLot> {
    const { userId, lotType, tokens, sourceId, expiresAt, graceHours } = awardTokensDto;

    const graceExpiresAt = addHours(expiresAt, graceHours);

    const lot = this.tokenLotRepository.create({
      userId,
      lotType,
      tokens,
      originalTokens: tokens,
      sourceId,
      awardedAt: nowET(),
      expiresAt,
      graceExpiresAt,
      expired: false,
    });

    return this.tokenLotRepository.save(lot);
  }

  /**
   * Get wallet balance for a user
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    // Expire old lots first
    await this.expireOldLots(userId);

    const lots = await this.getActiveLots(userId);

    const breakdown = {
      promoBonus: 0,
      membershipMonthly: 0,
      purchased: 0,
    };

    lots.forEach((lot) => {
      switch (lot.lotType) {
        case TokenLotType.PROMO_BONUS:
          breakdown.promoBonus += lot.tokens;
          break;
        case TokenLotType.MEMBERSHIP_MONTHLY:
          breakdown.membershipMonthly += lot.tokens;
          break;
        case TokenLotType.PURCHASED:
          breakdown.purchased += lot.tokens;
          break;
      }
    });

    const totalTokens = breakdown.promoBonus + breakdown.membershipMonthly + breakdown.purchased;

    return {
      totalTokens,
      breakdown,
      activeLots: lots.length,
    };
  }

  /**
   * Spend tokens (enforces spend order server-side)
   * CRITICAL: This must be idempotent and atomic
   */
  async spendTokens(userId: string, spendTokensDto: SpendTokensDto): Promise<TokenTransaction> {
    const { amount, purpose, idempotencyKey, sessionId, ipAddress } = spendTokensDto;

    // Check for duplicate request (idempotency)
    const existingTransaction = await this.tokenTransactionRepository.findOne({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      // Return existing transaction (idempotent)
      return existingTransaction;
    }

    // Use database transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Expire old lots first
      await this.expireOldLots(userId);

      // Get spend order from policy
      const spendOrder = await this.policyService.getValue<string[]>('token_spend_order');

      // Get active lots ordered by spend order, then by expiry
      const lots = await this.getLotsForSpending(userId, spendOrder);

      // Check if user has enough tokens
      const totalAvailable = lots.reduce((sum, lot) => sum + lot.tokens, 0);
      if (totalAvailable < amount) {
        throw new BadRequestException(
          `Insufficient tokens. Required: ${amount}, Available: ${totalAvailable}`,
        );
      }

      // Burn tokens from lots in spend order
      const lotsUsed: TokenLotUsage[] = [];
      let remainingToBurn = amount;

      for (const lot of lots) {
        if (remainingToBurn <= 0) break;

        const toBurnFromLot = Math.min(lot.tokens, remainingToBurn);
        lot.tokens -= toBurnFromLot;
        remainingToBurn -= toBurnFromLot;

        lotsUsed.push({
          lotId: lot.id,
          tokensUsed: toBurnFromLot,
          lotType: lot.lotType,
        });

        // Save updated lot
        await queryRunner.manager.save(lot);

        // If lot is empty, mark it for cleanup (but keep for audit)
        if (lot.tokens === 0) {
          // Optional: set a flag for cleanup, but preserve record
        }
      }

      // Create transaction record
      const transaction = this.tokenTransactionRepository.create({
        userId,
        amount,
        purpose,
        lotsUsed,
        idempotencyKey,
        sessionId,
        ipAddress,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get active lots for a user
   */
  async getActiveLots(userId: string): Promise<TokenLot[]> {
    return this.tokenLotRepository.find({
      where: {
        userId,
        expired: false,
      },
      order: {
        expiresAt: 'ASC',
      },
    });
  }

  /**
   * Get lots ordered by spend order for burning tokens
   */
  private async getLotsForSpending(userId: string, spendOrder: string[]): Promise<TokenLot[]> {
    const lots = await this.getActiveLots(userId);

    // Filter out empty lots
    const nonEmptyLots = lots.filter((lot) => lot.tokens > 0);

    // Sort by spend order priority, then by expiry
    return nonEmptyLots.sort((a, b) => {
      const aPriority = spendOrder.indexOf(a.lotType);
      const bPriority = spendOrder.indexOf(b.lotType);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Same priority, sort by expiry (oldest first)
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    });
  }

  /**
   * Expire lots that have passed their grace period
   */
  async expireOldLots(userId: string): Promise<number> {
    const now = nowET();

    const result = await this.tokenLotRepository.update(
      {
        userId,
        expired: false,
        graceExpiresAt: LessThanOrEqual(now),
      },
      {
        expired: true,
        tokens: 0, // Zero out remaining tokens
      },
    );

    return result.affected || 0;
  }

  /**
   * Manually expire a lot (admin only)
   */
  async expireLot(lotId: string): Promise<TokenLot> {
    const lot = await this.tokenLotRepository.findOne({ where: { id: lotId } });

    if (!lot) {
      throw new NotFoundException(`Token lot with ID "${lotId}" not found`);
    }

    lot.expired = true;
    lot.tokens = 0;

    return this.tokenLotRepository.save(lot);
  }

  /**
   * Get transaction history for a user
   */
  async getTransactions(userId: string, limit = 50): Promise<TokenTransaction[]> {
    return this.tokenTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get full audit trail for a user (admin only)
   */
  async getAuditTrail(userId: string): Promise<{
    lots: TokenLot[];
    transactions: TokenTransaction[];
  }> {
    const lots = await this.tokenLotRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const transactions = await this.tokenTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return { lots, transactions };
  }
}
