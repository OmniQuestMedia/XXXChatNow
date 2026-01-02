import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MoodMessagingService } from './mood-messaging.service';
import {
  MoodBucket,
  MoodBucketDocument,
  ModelMoodConfig,
  ModelMoodConfigDocument,
  UserMessageHistory,
  UserMessageHistoryDocument
} from '../schemas';

describe('MoodMessagingService', () => {
  let service: MoodMessagingService;
  let moodBucketModel: Model<MoodBucketDocument>;
  let modelMoodConfigModel: Model<ModelMoodConfigDocument>;
  let userMessageHistoryModel: Model<UserMessageHistoryDocument>;

  // Mock data
  const mockBucketId = '507f1f77bcf86cd799439011';
  const mockPerformerId = '507f1f77bcf86cd799439012';
  const mockUserId = '507f1f77bcf86cd799439013';

  const mockMoodBucket = {
    _id: mockBucketId,
    name: 'happy',
    description: 'Responses for users in positive moods',
    category: 'private_micro',
    responses: [
      "It's great to see you in high spirits!",
      "Awesome! Let's make this an even better day for you.",
      "Love the positive energy!"
    ],
    isDefault: true,
    visibility: 'private',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockModelConfig = {
    _id: 'config123',
    performerId: mockPerformerId,
    enabledBuckets: [mockBucketId],
    customResponses: [],
    settings: {
      autoRespond: false,
      responseDelay: 2,
      dailyLimit: 100
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    // Create mock save function that returns the saved object
    const mockSave = jest.fn().mockResolvedValue(mockModelConfig);
    
    // Mock constructor for ModelMoodConfig
    const MockModelMoodConfigConstructor: any = jest.fn().mockImplementation(() => ({
      save: mockSave,
      ...mockModelConfig
    }));
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoodMessagingService,
        {
          provide: getModelToken(MoodBucket.name),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: getModelToken(ModelMoodConfig.name),
          useValue: MockModelMoodConfigConstructor
        },
        {
          provide: getModelToken(UserMessageHistory.name),
          useValue: jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue({})
          }))
        }
      ]
    }).compile();

    service = module.get<MoodMessagingService>(MoodMessagingService);
    moodBucketModel = module.get<Model<MoodBucketDocument>>(
      getModelToken(MoodBucket.name)
    );
    modelMoodConfigModel = module.get<Model<ModelMoodConfigDocument>>(
      getModelToken(ModelMoodConfig.name)
    );
    
    // Add mock methods to the constructor function
    (modelMoodConfigModel as any).findOne = jest.fn();
    (modelMoodConfigModel as any).findOneAndUpdate = jest.fn();
    (modelMoodConfigModel as any).find = jest.fn();
    
    userMessageHistoryModel = module.get<Model<UserMessageHistoryDocument>>(
      getModelToken(UserMessageHistory.name)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('selectMoodResponse', () => {
    it('should select a response from the bucket', async () => {
      const dto: any = {
        bucketName: 'happy'
      };

      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockMoodBucket as any);
      (modelMoodConfigModel as any).findOne.mockResolvedValue(null);

      const result = await service.selectMoodResponse(dto, mockUserId);

      expect(result.success).toBe(true);
      expect(result.bucketName).toBe('happy');
      expect(result.bucketId).toBe(mockBucketId);
      expect(mockMoodBucket.responses).toContain(result.response);
      expect(moodBucketModel.findOne).toHaveBeenCalledWith({
        name: 'happy',
        active: true
      });
    });

    it('should use custom responses when performer has custom config', async () => {
      const customResponses = ['Custom response 1', 'Custom response 2'];
      const configWithCustom = {
        ...mockModelConfig,
        customResponses: [
          {
            bucketId: mockBucketId,
            responses: customResponses
          }
        ]
      };

      const dto: any = {
        bucketName: 'happy',
        performerId: mockPerformerId
      };

      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockMoodBucket as any);
      jest.spyOn(modelMoodConfigModel, 'findOne').mockResolvedValue(configWithCustom as any);

      const result = await service.selectMoodResponse(dto, mockUserId);

      expect(result.success).toBe(true);
      expect(customResponses).toContain(result.response);
    });

    it('should throw NotFoundException when bucket does not exist', async () => {
      const dto: any = {
        bucketName: 'nonexistent'
      };

      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(null);

      await expect(service.selectMoodResponse(dto, mockUserId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when bucket has no responses', async () => {
      const emptyBucket = { ...mockMoodBucket, responses: [] };
      const dto: any = {
        bucketName: 'happy'
      };

      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(emptyBucket as any);

      await expect(service.selectMoodResponse(dto, mockUserId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle context information', async () => {
      const dto: any = {
        bucketName: 'happy',
        context: {
          messageType: 'tip',
          amount: 100
        }
      };

      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockMoodBucket as any);
      jest.spyOn(modelMoodConfigModel, 'findOne').mockResolvedValue(null);

      const result = await service.selectMoodResponse(dto, mockUserId);

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    it('should select different responses on multiple calls (probabilistic test)', async () => {
      const dto: any = {
        bucketName: 'happy'
      };

      jest.spyOn(moodBucketModel, 'findOne').mockResolvedValue(mockMoodBucket as any);
      jest.spyOn(modelMoodConfigModel, 'findOne').mockResolvedValue(null);

      const responses = new Set<string>();
      const iterations = 20;

      // Run multiple times to check randomization
      for (let i = 0; i < iterations; i++) {
        const result = await service.selectMoodResponse(dto, mockUserId);
        responses.add(result.response);
      }

      // With 3 responses and 20 iterations, we should see at least 2 different responses
      // (unless we're extremely unlucky with randomization)
      expect(responses.size).toBeGreaterThan(1);
    });
  });

  describe('getModelConfig', () => {
    it('should return existing config', async () => {
      jest
        .spyOn(modelMoodConfigModel, 'findOne')
        .mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockModelConfig)
        } as any);

      const result = await service.getModelConfig(mockPerformerId);

      expect(result).toEqual(mockModelConfig);
      expect(modelMoodConfigModel.findOne).toHaveBeenCalledWith({
        performerId: mockPerformerId
      });
    });

    it('should create default config if none exists', async () => {
      (modelMoodConfigModel as any).findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      jest.spyOn(moodBucketModel, 'find').mockResolvedValue([mockMoodBucket] as any);

      const result = await service.getModelConfig(mockPerformerId);

      expect(moodBucketModel.find).toHaveBeenCalledWith({
        isDefault: true,
        active: true
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('updateModelConfig', () => {
    it('should update model configuration', async () => {
      const updateDto = {
        enabledBuckets: [mockBucketId],
        settings: {
          autoRespond: true,
          responseDelay: 5,
          dailyLimit: 50
        }
      };

      jest.spyOn(moodBucketModel, 'find').mockResolvedValue([mockMoodBucket] as any);
      (modelMoodConfigModel as any).findOneAndUpdate.mockResolvedValue({
        ...mockModelConfig,
        settings: updateDto.settings
      });

      const result = await service.updateModelConfig(mockPerformerId, updateDto);

      expect(result.settings.autoRespond).toBe(true);
      expect(result.settings.responseDelay).toBe(5);
      expect(result.settings.dailyLimit).toBe(50);
    });

    it('should validate enabled buckets exist', async () => {
      const updateDto = {
        enabledBuckets: ['invalid-id']
      };

      jest.spyOn(moodBucketModel, 'find').mockResolvedValue([]);

      await expect(
        service.updateModelConfig(mockPerformerId, updateDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate custom responses bucket IDs', async () => {
      const updateDto = {
        customResponses: [
          {
            bucketId: 'invalid-id',
            responses: ['Custom response']
          }
        ]
      };

      jest.spyOn(moodBucketModel, 'find').mockResolvedValue([]);

      await expect(
        service.updateModelConfig(mockPerformerId, updateDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('restoreDefaults', () => {
    it('should restore default configuration', async () => {
      jest.spyOn(moodBucketModel, 'find').mockResolvedValue([mockMoodBucket] as any);
      (modelMoodConfigModel as any).findOneAndUpdate.mockResolvedValue(mockModelConfig);

      const result = await service.restoreDefaults(mockPerformerId);

      expect(result.customResponses).toEqual([]);
      expect(result.settings.autoRespond).toBe(false);
      expect(result.settings.responseDelay).toBe(2);
      expect(result.settings.dailyLimit).toBe(100);
    });
  });
});
