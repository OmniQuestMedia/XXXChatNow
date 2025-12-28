import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletRateLimitService } from './wallet-rate-limit.service';
import { User } from '../../user/schemas/user.schema';

describe('WalletService', () => {
  let service: WalletService;
  let userModel: Model<User>;
  let rateLimitService: WalletRateLimitService;

  const mockUserId = new ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            updateOne: jest.fn()
          }
        },
        {
          provide: WalletRateLimitService,
          useValue: {
            checkVerificationRateLimit: jest.fn(),
            recordAttempt: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<WalletService>(WalletService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    rateLimitService = module.get<WalletRateLimitService>(WalletRateLimitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return wallet balance with verification status', async () => {
      const mockUser = {
        _id: mockUserId,
        balance: 100,
        walletVerified: true,
        walletVerifiedAt: new Date('2025-12-23T00:00:00Z'),
        currency: 'USD'
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.getBalance(mockUserId);

      expect(result).toEqual({
        balance: 100,
        walletVerified: true,
        walletVerifiedAt: mockUser.walletVerifiedAt,
        currency: 'USD'
      });
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
    });

    it('should return default values for user without wallet data', async () => {
      const mockUser = {
        _id: mockUserId,
        balance: 0
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.getBalance(mockUserId);

      expect(result).toEqual({
        balance: 0,
        walletVerified: false,
        walletVerifiedAt: undefined,
        currency: 'USD'
      });
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(service.getBalance(mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for verified wallet', async () => {
      const verifiedAt = new Date('2025-12-23T00:00:00Z');
      const mockUser = {
        _id: mockUserId,
        walletVerified: true,
        walletVerifiedAt: verifiedAt
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.getVerificationStatus(mockUserId);

      expect(result).toEqual({
        verified: true,
        verifiedAt
      });
    });

    it('should return unverified status for unverified wallet', async () => {
      const mockUser = {
        _id: mockUserId,
        walletVerified: false
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.getVerificationStatus(mockUserId);

      expect(result).toEqual({
        verified: false,
        verifiedAt: undefined
      });
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(service.getVerificationStatus(mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('verifyWallet', () => {
    it('should verify wallet for unverified user', async () => {
      const mockUser = {
        _id: mockUserId,
        walletVerified: false
      };

      jest.spyOn(rateLimitService, 'checkVerificationRateLimit').mockResolvedValue(undefined);
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(userModel, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);
      jest.spyOn(rateLimitService, 'recordAttempt').mockResolvedValue(undefined);

      const result = await service.verifyWallet(mockUserId);

      expect(result.verified).toBe(true);
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(rateLimitService.checkVerificationRateLimit).toHaveBeenCalledWith(mockUserId);
      expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: mockUserId },
        expect.objectContaining({
          $set: expect.objectContaining({
            walletVerified: true,
            walletVerifiedAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        })
      );
      expect(rateLimitService.recordAttempt).toHaveBeenCalledWith(mockUserId, 'success', undefined);
    });

    it('should return existing verification if already verified', async () => {
      const verifiedAt = new Date('2025-12-23T00:00:00Z');
      const mockUser = {
        _id: mockUserId,
        walletVerified: true,
        walletVerifiedAt: verifiedAt
      };

      jest.spyOn(rateLimitService, 'checkVerificationRateLimit').mockResolvedValue(undefined);
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.verifyWallet(mockUserId);

      expect(result).toEqual({
        verified: true,
        verifiedAt
      });
      expect(userModel.updateOne).not.toHaveBeenCalled();
      expect(rateLimitService.recordAttempt).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(rateLimitService, 'checkVerificationRateLimit').mockResolvedValue(undefined);
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);
      jest.spyOn(rateLimitService, 'recordAttempt').mockResolvedValue(undefined);

      await expect(service.verifyWallet(mockUserId)).rejects.toThrow(
        BadRequestException
      );
      
      expect(rateLimitService.recordAttempt).toHaveBeenCalledWith(
        mockUserId,
        'failed',
        expect.objectContaining({ failureReason: 'User not found' })
      );
    });
  });

  describe('isWalletVerified', () => {
    it('should return true for verified wallet', async () => {
      const mockUser = {
        walletVerified: true
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.isWalletVerified(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false for unverified wallet', async () => {
      const mockUser = {
        walletVerified: false
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);

      const result = await service.isWalletVerified(mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      const result = await service.isWalletVerified(mockUserId);

      expect(result).toBe(false);
    });
  });
});
