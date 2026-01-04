import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MoodMessagingService } from './mood-messaging.service';
import { ModelMoodState } from '../schemas/mood-state.schema';
import { MoodState, TemplateType, TierLevel } from '../constants';
import { DBLoggerService } from 'src/modules/logger';

describe('MoodMessagingService', () => {
  let service: MoodMessagingService;
  let moodStateModel: Model<ModelMoodState>;
  let loggerService: DBLoggerService;

  const mockPerformerId = new Types.ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoodMessagingService,
        {
          provide: getModelToken(ModelMoodState.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            updateOne: jest.fn()
          }
        },
        {
          provide: DBLoggerService,
          useValue: {
            error: jest.fn(),
            log: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<MoodMessagingService>(MoodMessagingService);
    moodStateModel = module.get<Model<ModelMoodState>>(getModelToken(ModelMoodState.name));
    loggerService = module.get<DBLoggerService>(DBLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMoodState', () => {
    it('should return NEUTRAL when no mood state exists', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const result = await service.getMoodState(mockPerformerId);

      expect(result).toBe(MoodState.NEUTRAL);
      expect(moodStateModel.findOne).toHaveBeenCalledWith({ modelId: mockPerformerId });
    });

    it('should return the stored mood state', async () => {
      const mockMoodState = {
        modelId: mockPerformerId,
        moodState: MoodState.POSITIVE,
        customMessage: 'Feeling great!',
        autoRespond: false,
        responseDelay: 0
      };

      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMoodState)
      } as any);

      const result = await service.getMoodState(mockPerformerId);

      expect(result).toBe(MoodState.POSITIVE);
    });

    it('should return NEUTRAL when mood state is expired', async () => {
      const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const mockMoodState = {
        modelId: mockPerformerId,
        moodState: MoodState.POSITIVE,
        expiresAt: expiredDate
      };

      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMoodState)
      } as any);

      const result = await service.getMoodState(mockPerformerId);

      expect(result).toBe(MoodState.NEUTRAL);
    });

    it('should return NEUTRAL and log error on database failure', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const result = await service.getMoodState(mockPerformerId);

      expect(result).toBe(MoodState.NEUTRAL);
      expect(loggerService.error).toHaveBeenCalledWith(
        'Error fetching mood state, defaulting to NEUTRAL',
        expect.objectContaining({
          context: 'MoodMessagingService',
          performerId: mockPerformerId.toString()
        })
      );
    });
  });

  describe('renderTemplate', () => {
    it('should render NEUTRAL mood template for FREE tier', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null) // No mood state = NEUTRAL
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: 'TestUser', amount: 50 }
      );

      expect(result).toContain('TestUser');
      expect(result).toContain('50');
      expect(result).toContain('Thank you');
    });

    it('should render POSITIVE mood template for GOLD tier', async () => {
      const mockMoodState = {
        modelId: mockPerformerId,
        moodState: MoodState.POSITIVE
      };

      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMoodState)
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.GOLD,
        { userName: 'GoldUser', amount: 100 }
      );

      expect(result).toContain('GoldUser');
      expect(result).toContain('100');
      // Positive mood should have enthusiastic messaging
      expect(result.toLowerCase()).toMatch(/wow|amazing|incredible/i);
    });

    it('should render NEGATIVE mood template with reserved tone', async () => {
      const mockMoodState = {
        modelId: mockPerformerId,
        moodState: MoodState.NEGATIVE
      };

      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMoodState)
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.SILVER,
        { userName: 'User123', amount: 25 }
      );

      expect(result).toContain('User123');
      expect(result).toContain('25');
      // Negative mood should have more reserved tone
      expect(result).toContain('Thanks' || 'Thank you');
    });

    it('should use tier-specific templates', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const freeTierResult = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: 'FreeUser', amount: 10 }
      );

      const platinumTierResult = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.PLATINUM,
        { userName: 'PlatinumUser', amount: 1000 }
      );

      // Platinum tier should have more enthusiastic messaging
      expect(platinumTierResult.length).toBeGreaterThan(freeTierResult.length);
    });

    it('should fall back to default tier when tier is null', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        null,
        { userName: 'NoTierUser', amount: 50 }
      );

      expect(result).toContain('NoTierUser');
      expect(result).toContain('50');
      expect(result).toContain('Thank you');
    });

    it('should return generic fallback on rendering error', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: 'TestUser', amount: 50 }
      );

      expect(result).toContain('Thank you');
      expect(loggerService.error).toHaveBeenCalledWith(
        'Error rendering mood template',
        expect.objectContaining({
          context: 'MoodMessagingService'
        })
      );
    });

    it('should substitute all variables correctly', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: 'Alice', amount: 75 }
      );

      expect(result).toContain('Alice');
      expect(result).toContain('75');
      // Should not contain unsubstituted placeholders
      expect(result).not.toMatch(/\{\{.*\}\}/);
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle null performerId gracefully', async () => {
      const result = await service.renderTemplate(
        null as any,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: 'TestUser', amount: 50 }
      );

      expect(result).toContain('Thank you');
    });

    it('should handle missing variable values', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const result = await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: undefined, amount: 50 }
      );

      expect(result).toContain('50');
      // Should still render even with undefined userName
      expect(result).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should retrieve mood state efficiently', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const startTime = Date.now();
      await service.getMoodState(mockPerformerId);
      const endTime = Date.now();

      // Should complete in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should render template efficiently', async () => {
      jest.spyOn(moodStateModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      } as any);

      const startTime = Date.now();
      await service.renderTemplate(
        mockPerformerId,
        TemplateType.TIP_THANK_YOU,
        TierLevel.FREE,
        { userName: 'TestUser', amount: 50 }
      );
      const endTime = Date.now();

      // Should complete in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
