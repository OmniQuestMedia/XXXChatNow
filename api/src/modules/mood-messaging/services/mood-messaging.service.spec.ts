import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { MoodMessagingService } from './mood-messaging.service';
import {
  MoodBucket,
  TierBucketMapping,
  PublicMicroGratitude,
  MoodMessageHistory
} from '../schemas';

describe('MoodMessagingService', () => {
  let service: MoodMessagingService;
  let moodBucketModel: Model<MoodBucket>;
  let tierBucketMappingModel: Model<TierBucketMapping>;
  let publicMicroGratitudeModel: Model<PublicMicroGratitude>;
  let moodMessageHistoryModel: Model<MoodMessageHistory>;

  const mockUserId = new ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoodMessagingService,
        {
          provide: getModelToken(MoodBucket.name),
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: getModelToken(TierBucketMapping.name),
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: getModelToken(PublicMicroGratitude.name),
          useValue: {
            find: jest.fn()
          }
        },
        {
          provide: getModelToken(MoodMessageHistory.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<MoodMessagingService>(MoodMessagingService);
    moodBucketModel = module.get<Model<MoodBucket>>(getModelToken(MoodBucket.name));
    tierBucketMappingModel = module.get<Model<TierBucketMapping>>(getModelToken(TierBucketMapping.name));
    publicMicroGratitudeModel = module.get<Model<PublicMicroGratitude>>(getModelToken(PublicMicroGratitude.name));
    moodMessageHistoryModel = module.get<Model<MoodMessageHistory>>(getModelToken(MoodMessageHistory.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrivateMoodMessage', () => {
    it('should return a mood message with username substituted', async () => {
      const mockTierMapping = {
        tierKey: 'gold_vip',
        tierName: 'Gold VIP',
        buckets: ['cute', 'flirty'],
        hasSecondaryMicro: true
      };

      const mockBucket = {
        key: 'cute',
        name: 'Cute',
        responses: [
          'Hey <user>! You\'re adorable 🥰',
          'You make me smile, <user> 😊',
          '<user>, you\'re so sweet! 💕'
        ]
      };

      const mockHistory = {
        userId: mockUserId,
        messageType: 'private_mood',
        bucketKey: 'cute',
        usedResponseIndices: [],
        cycleCount: 0,
        lastUsedAt: new Date(),
        save: jest.fn()
      };

      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(mockTierMapping as any);
      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockBucket as any);
      jest.spyOn(moodMessageHistoryModel, 'findOne').mockResolvedValue(mockHistory as any);

      const result = await service.getPrivateMoodMessage(mockUserId, 'gold_vip', 'TestUser');

      expect(result).toBeDefined();
      expect(result).not.toContain('<user>');
      expect(result).toContain('TestUser');
      expect(tierBucketMappingModel.findOne).toHaveBeenCalledWith({ tierKey: 'gold_vip' });
      expect(mockHistory.save).toHaveBeenCalled();
    });

    it('should fall back to guest tier if tier not found', async () => {
      const mockGuestMapping = {
        tierKey: 'guest',
        tierName: 'Guest',
        buckets: ['soft_sell'],
        hasSecondaryMicro: false
      };

      const mockBucket = {
        key: 'soft_sell',
        name: 'Soft Sell',
        responses: ['<user>, want to unlock more? 💎']
      };

      const mockHistory = {
        userId: mockUserId,
        messageType: 'private_mood',
        bucketKey: 'soft_sell',
        usedResponseIndices: [],
        cycleCount: 0,
        lastUsedAt: new Date(),
        save: jest.fn()
      };

      jest.spyOn(tierBucketMappingModel, 'findOne')
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce(mockGuestMapping as any); // Second call returns guest
      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockBucket as any);
      jest.spyOn(moodMessageHistoryModel, 'findOne').mockResolvedValue(mockHistory as any);

      const result = await service.getPrivateMoodMessage(mockUserId, 'invalid_tier', 'TestUser');

      expect(result).toBeDefined();
      expect(result).toContain('TestUser');
    });

    it('should select non-repetitive responses', async () => {
      const mockTierMapping = {
        tierKey: 'gold_vip',
        tierName: 'Gold VIP',
        buckets: ['cute'],
        hasSecondaryMicro: true
      };

      const mockBucket = {
        key: 'cute',
        name: 'Cute',
        responses: [
          'Response 0',
          'Response 1',
          'Response 2',
          'Response 3',
          'Response 4'
        ]
      };

      const mockHistory = {
        userId: mockUserId,
        messageType: 'private_mood',
        bucketKey: 'cute',
        usedResponseIndices: [0, 1, 2], // Already used 0, 1, 2
        cycleCount: 3,
        lastUsedAt: new Date(),
        save: jest.fn()
      };

      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(mockTierMapping as any);
      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockBucket as any);
      jest.spyOn(moodMessageHistoryModel, 'findOne').mockResolvedValue(mockHistory as any);

      const result = await service.getPrivateMoodMessage(mockUserId, 'gold_vip', 'TestUser');

      // Should get either Response 3 or Response 4, not 0, 1, or 2
      expect(result).toBeDefined();
      expect(['Response 3', 'Response 4']).toContain(result);
      expect(mockHistory.save).toHaveBeenCalled();
      expect(mockHistory.usedResponseIndices.length).toBeGreaterThan(3);
    });
  });

  describe('getPublicMicroGratitudeMessage', () => {
    it('should return a public gratitude message', async () => {
      const mockGratitudeMessages = [
        { responseId: 0, text: 'Thanks babe 😘' },
        { responseId: 1, text: 'You rock 💋' },
        { responseId: 2, text: 'Much love 😘' }
      ];

      const mockHistory = {
        userId: mockUserId,
        messageType: 'public_micro_gratitude',
        bucketKey: 'public_micro_gratitude',
        usedResponseIndices: [],
        cycleCount: 0,
        lastUsedAt: new Date(),
        save: jest.fn()
      };

      jest.spyOn(publicMicroGratitudeModel, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockGratitudeMessages)
      } as any);
      jest.spyOn(moodMessageHistoryModel, 'findOne').mockResolvedValue(mockHistory as any);

      const result = await service.getPublicMicroGratitudeMessage(mockUserId);

      expect(result).toBeDefined();
      expect(mockGratitudeMessages.map(m => m.text)).toContain(result);
      expect(mockHistory.save).toHaveBeenCalled();
    });

    it('should not repeat messages within 5 cycles', async () => {
      const mockGratitudeMessages = Array.from({ length: 10 }, (_, i) => ({
        responseId: i,
        text: `Message ${i}`
      }));

      const mockHistory = {
        userId: mockUserId,
        messageType: 'public_micro_gratitude',
        bucketKey: 'public_micro_gratitude',
        usedResponseIndices: [0, 1, 2, 3, 4], // Last 5 used
        cycleCount: 5,
        lastUsedAt: new Date(),
        save: jest.fn()
      };

      jest.spyOn(publicMicroGratitudeModel, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockGratitudeMessages)
      } as any);
      jest.spyOn(moodMessageHistoryModel, 'findOne').mockResolvedValue(mockHistory as any);

      const result = await service.getPublicMicroGratitudeMessage(mockUserId);

      expect(result).toBeDefined();
      // Should not be any of the last 5 used messages
      expect(['Message 0', 'Message 1', 'Message 2', 'Message 3', 'Message 4']).not.toContain(result);
      expect(mockHistory.save).toHaveBeenCalled();
    });
  });

  describe('getAvailableBucketsForTier', () => {
    it('should return available buckets for a tier', async () => {
      const mockTierMapping = {
        tierKey: 'gold_vip',
        tierName: 'Gold VIP',
        buckets: ['flirty', 'playful', 'bratty', 'spicy'],
        hasSecondaryMicro: true
      };

      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(mockTierMapping as any);

      const result = await service.getAvailableBucketsForTier('gold_vip');

      expect(result).toEqual(['flirty', 'playful', 'bratty', 'spicy']);
      expect(tierBucketMappingModel.findOne).toHaveBeenCalledWith({ tierKey: 'gold_vip' });
    });

    it('should return empty array if tier not found', async () => {
      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(null);

      const result = await service.getAvailableBucketsForTier('invalid_tier');

      expect(result).toEqual([]);
    });
  });

  describe('hasSecondaryMicroAccess', () => {
    it('should return true for gold_vip tier', async () => {
      const mockTierMapping = {
        tierKey: 'gold_vip',
        tierName: 'Gold VIP',
        buckets: ['flirty', 'playful', 'bratty', 'spicy'],
        hasSecondaryMicro: true
      };

      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(mockTierMapping as any);

      const result = await service.hasSecondaryMicroAccess('gold_vip');

      expect(result).toBe(true);
    });

    it('should return false for guest tier', async () => {
      const mockTierMapping = {
        tierKey: 'guest',
        tierName: 'Guest',
        buckets: ['soft_sell'],
        hasSecondaryMicro: false
      };

      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(mockTierMapping as any);

      const result = await service.hasSecondaryMicroAccess('guest');

      expect(result).toBe(false);
    });

    it('should return false if tier not found', async () => {
      jest.spyOn(tierBucketMappingModel, 'findOne').mockResolvedValue(null);

      const result = await service.hasSecondaryMicroAccess('invalid_tier');

      expect(result).toBe(false);
    });
  });
});
