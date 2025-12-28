import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User } from '../../user/schemas/user.schema';
import { WalletBalanceDto, WalletVerificationStatusDto } from '../dtos';

/**
 * Service for wallet operations including balance retrieval and verification
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<User>
  ) {}

  /**
   * Get wallet balance with verification status for a user
   */
  async getBalance(userId: ObjectId): Promise<WalletBalanceDto> {
    const user = await this.UserModel.findById(userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      balance: user.balance || 0,
      walletVerified: user.walletVerified || false,
      walletVerifiedAt: user.walletVerifiedAt,
      currency: user.currency || 'USD'
    };
  }

  /**
   * Get wallet verification status
   */
  async getVerificationStatus(userId: ObjectId): Promise<WalletVerificationStatusDto> {
    const user = await this.UserModel.findById(userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      verified: user.walletVerified || false,
      verifiedAt: user.walletVerifiedAt
    };
  }

  /**
   * Verify wallet for a user
   * Note: This is a simplified implementation. In production, this would involve
   * additional verification steps such as identity verification, document upload,
   * or integration with third-party verification services.
   */
  async verifyWallet(userId: ObjectId): Promise<WalletVerificationStatusDto> {
    const user = await this.UserModel.findById(userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.walletVerified) {
      this.logger.warn(`Wallet already verified for user ${userId}`);
      return {
        verified: true,
        verifiedAt: user.walletVerifiedAt
      };
    }

    // Update wallet verification status
    const now = new Date();
    await this.UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          walletVerified: true,
          walletVerifiedAt: now,
          updatedAt: now
        }
      }
    );

    this.logger.log(`Wallet verified for user ${userId}`);

    return {
      verified: true,
      verifiedAt: now
    };
  }

  /**
   * Check if user has verified wallet
   */
  async isWalletVerified(userId: ObjectId): Promise<boolean> {
    const user = await this.UserModel.findById(userId);
    return user?.walletVerified || false;
  }
}
