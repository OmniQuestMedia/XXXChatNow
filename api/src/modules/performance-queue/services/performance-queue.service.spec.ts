/**
 * Performance Queue Service Tests
 * 
 * Unit tests for core queue management functionality.
 * Tests FIFO ordering, mode detection, idempotency, and state transitions.
 * 
 * References:
 * - XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md
 * - CURRENT_STATUS_AND_NEXT_STEPS.md (Section 3)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PerformanceQueueService } from './performance-queue.service';
import { QueueItem } from '../schemas';
import { QueueItemStatus, QueueMode, QUEUE_LIMITS, QUEUE_ERRORS } from '../constants';
import { QueueIntakePayload, RefundReason } from '../payloads';
import { ObjectId } from 'mongodb';

describe('PerformanceQueueService', () => {
  let service: PerformanceQueueService;
  let mockQueueItemModel: any;

  // Mock queue items
  const mockPerformerId = new ObjectId();
  const mockUserId = new ObjectId();

  const createMockIntakePayload = (overrides?: Partial<QueueIntakePayload>): QueueIntakePayload => ({
    idempotencyKey: `test_${Date.now()}_${Math.random()}`,
    sourceFeature: 'slot_machine',
    sourceEventId: 'spin_123',
    performerId: mockPerformerId.toString(),
    userId: mockUserId.toString(),
    escrowTransactionId: 'escrow_123',
    tokens: 100,
    title: 'Test Queue Item',
    description: 'Test description',
    durationSeconds: 60,
    metadata: {},
    ...overrides
  });

  beforeEach(async () => {
    // Create mock model with Jest functions that support chaining
    const mockFindOne = jest.fn();
    mockFindOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null)
    });
    
    mockQueueItemModel = jest.fn((data) => ({
      ...data,
      _id: new ObjectId(),
      save: jest.fn().mockResolvedValue({ ...data, _id: new ObjectId() })
    }));
    
    mockQueueItemModel.findOne = mockFindOne;
    mockQueueItemModel.findById = jest.fn();
    mockQueueItemModel.find = jest.fn();
    mockQueueItemModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceQueueService,
        {
          provide: getModelToken(QueueItem.name),
          useValue: mockQueueItemModel
        }
      ]
    }).compile();

    service = module.get<PerformanceQueueService>(PerformanceQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQueueItem', () => {
    it('should create a queued item in ON mode', async () => {
      const intake = createMockIntakePayload();
      
      // Mock idempotency check (no existing item)
      const findOneMock = jest.fn()
        .mockReturnValueOnce(null) // First call - idempotency check
        .mockReturnValueOnce({ // Second call - last position check with sort
          sort: jest.fn().mockResolvedValue(null)
        });
      
      mockQueueItemModel.findOne = findOneMock;
      
      // Mock queue depth check
      mockQueueItemModel.countDocuments = jest.fn().mockResolvedValue(0);
      
      // Create mock save function and instance
      const savedItem = {
        ...intake,
        _id: new ObjectId(),
        status: QueueItemStatus.CREATED,
        position: 1,
        performerId: mockPerformerId,
        userId: mockUserId
      };
      
      const mockSave = jest.fn().mockResolvedValue(savedItem);
      const mockInstance = {
        ...savedItem,
        save: mockSave
      };
      
      // Mock the model constructor to return object with save
      mockQueueItemModel.mockReturnValue(mockInstance);

      const result = await service.createQueueItem(intake, QueueMode.ON);

      expect(result.status).toBe(QueueItemStatus.CREATED);
      expect(result.position).toBe(1);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should create a pass-through item in OFF mode', async () => {
      const intake = createMockIntakePayload();
      
      // Mock idempotency check
      mockQueueItemModel.findOne = jest.fn().mockResolvedValue(null);
      
      const savedItem = {
        ...intake,
        _id: new ObjectId(),
        status: QueueItemStatus.FINISHED,
        passThroughMode: true,
        performerId: mockPerformerId,
        userId: mockUserId
      };
      
      const mockSave = jest.fn().mockResolvedValue(savedItem);
      const mockInstance = {
        ...savedItem,
        save: mockSave
      };
      
      mockQueueItemModel.mockReturnValue(mockInstance);

      const result = await service.createQueueItem(intake, QueueMode.OFF);

      expect(result.status).toBe(QueueItemStatus.FINISHED);
      expect(result.passThroughMode).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return existing item if idempotency key exists', async () => {
      const intake = createMockIntakePayload();
      const existingItem = {
        ...intake,
        _id: new ObjectId(),
        status: QueueItemStatus.CREATED
      };

      mockQueueItemModel.findOne = jest.fn().mockResolvedValue(existingItem);

      const result = await service.createQueueItem(intake, QueueMode.ON);

      expect(result).toBe(existingItem);
    });

    it('should throw error if queue is full', async () => {
      const intake = createMockIntakePayload();
      
      mockQueueItemModel.findOne = jest.fn().mockResolvedValue(null);
      mockQueueItemModel.countDocuments = jest.fn().mockResolvedValue(QUEUE_LIMITS.MAX_QUEUE_DEPTH);

      await expect(
        service.createQueueItem(intake, QueueMode.ON)
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const invalidIntake = {
        idempotencyKey: 'test_key'
        // Missing required fields
      } as any;

      // Mock idempotency check to return null (no existing item)
      mockQueueItemModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.createQueueItem(invalidIntake, QueueMode.ON)
      ).rejects.toThrow('sourceFeature is required');
    });
  });

  describe('getQueuePosition', () => {
    it('should return position information for a queue item', async () => {
      const itemId = new ObjectId().toString();
      const mockItem = {
        _id: new ObjectId(itemId),
        performerId: mockPerformerId,
        position: 3,
        status: QueueItemStatus.CREATED
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);
      mockQueueItemModel.countDocuments = jest.fn().mockResolvedValue(5);
      
      // Mock items ahead for wait time calculation
      mockQueueItemModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { durationSeconds: 60 },
          { durationSeconds: 120 }
        ])
      });

      const result = await service.getQueuePosition(itemId);

      expect(result.itemId).toBe(itemId);
      expect(result.position).toBe(3);
      expect(result.totalInQueue).toBe(5);
    });

    it('should throw error if item not found', async () => {
      mockQueueItemModel.findById = jest.fn().mockResolvedValue(null);

      await expect(
        service.getQueuePosition('invalid_id')
      ).rejects.toThrow();
    });
  });

  describe('startItem', () => {
    it('should transition item from CREATED to STARTED', async () => {
      const itemId = new ObjectId().toString();
      const mockItem: any = {
        _id: new ObjectId(itemId),
        performerId: mockPerformerId,
        status: QueueItemStatus.CREATED,
        startedAt: null,
        updatedAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);
      mockQueueItemModel.findOne = jest.fn().mockResolvedValue(null); // No active item

      const result = await service.startItem(itemId);

      expect(mockItem.status).toBe(QueueItemStatus.STARTED);
      expect(mockItem.startedAt).toBeDefined();
      expect(mockItem.save).toHaveBeenCalled();
    });

    it('should throw error if item not in CREATED status', async () => {
      const itemId = new ObjectId().toString();
      const mockItem = {
        _id: new ObjectId(itemId),
        status: QueueItemStatus.STARTED
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);

      await expect(
        service.startItem(itemId)
      ).rejects.toThrow();
    });
  });

  describe('completeItem', () => {
    it('should transition item from STARTED to FINISHED', async () => {
      const itemId = new ObjectId().toString();
      const mockItem: any = {
        _id: new ObjectId(itemId),
        performerId: mockPerformerId,
        status: QueueItemStatus.STARTED,
        passThroughMode: false,
        finishedAt: null,
        updatedAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);
      
      // Mock recalculate positions
      mockQueueItemModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await service.completeItem(itemId);

      expect(mockItem.status).toBe(QueueItemStatus.FINISHED);
      expect(mockItem.finishedAt).toBeDefined();
      expect(mockItem.save).toHaveBeenCalled();
    });
  });

  describe('abandonItem', () => {
    it('should transition item to ABANDONED status', async () => {
      const itemId = new ObjectId().toString();
      const mockItem: any = {
        _id: new ObjectId(itemId),
        performerId: mockPerformerId,
        status: QueueItemStatus.STARTED,
        abandonedAt: null,
        updatedAt: null,
        refundReason: null,
        save: jest.fn().mockResolvedValue(true)
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);
      
      // Mock recalculate positions
      mockQueueItemModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const reason = 'Performer disconnected';
      const result = await service.abandonItem(itemId, reason);

      expect(mockItem.status).toBe(QueueItemStatus.ABANDONED);
      expect(mockItem.abandonedAt).toBeDefined();
      expect(mockItem.refundReason).toBe(reason);
      expect(mockItem.save).toHaveBeenCalled();
    });
  });

  describe('refundItem', () => {
    it('should transition item to REFUNDED status', async () => {
      const itemId = new ObjectId().toString();
      const mockItem: any = {
        _id: new ObjectId(itemId),
        performerId: mockPerformerId,
        status: QueueItemStatus.CREATED,
        settled: false,
        refundedAt: null,
        refundReason: null,
        updatedAt: null,
        save: jest.fn().mockResolvedValue(true)
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);
      
      // Mock recalculate positions
      mockQueueItemModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await service.refundItem(itemId, RefundReason.USER_CANCELLED);

      expect(mockItem.status).toBe(QueueItemStatus.REFUNDED);
      expect(mockItem.refundedAt).toBeDefined();
      expect(mockItem.refundReason).toBe(RefundReason.USER_CANCELLED);
      expect(mockItem.save).toHaveBeenCalled();
    });

    it('should throw error if item already refunded', async () => {
      const itemId = new ObjectId().toString();
      const mockItem = {
        _id: new ObjectId(itemId),
        status: QueueItemStatus.REFUNDED
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);

      await expect(
        service.refundItem(itemId, RefundReason.USER_CANCELLED)
      ).rejects.toThrow();
    });

    it('should throw error if item already settled', async () => {
      const itemId = new ObjectId().toString();
      const mockItem = {
        _id: new ObjectId(itemId),
        status: QueueItemStatus.FINISHED,
        settled: true
      };

      mockQueueItemModel.findById = jest.fn().mockResolvedValue(mockItem);

      await expect(
        service.refundItem(itemId, RefundReason.USER_CANCELLED)
      ).rejects.toThrow();
    });
  });

  describe('getQueueDepth', () => {
    it('should return current queue depth for performer', async () => {
      const performerId = mockPerformerId.toString();
      mockQueueItemModel.countDocuments = jest.fn().mockResolvedValue(5);

      const result = await service.getQueueDepth(performerId);

      expect(result).toBe(5);
      expect(mockQueueItemModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          performerId: expect.any(ObjectId),
          status: expect.objectContaining({
            $in: [QueueItemStatus.CREATED, QueueItemStatus.STARTED]
          })
        })
      );
    });
  });

  describe('getPerformerQueue', () => {
    it('should return active queue items for performer', async () => {
      const performerId = mockPerformerId.toString();
      const mockItems = [
        { _id: new ObjectId(), position: 1, status: QueueItemStatus.CREATED },
        { _id: new ObjectId(), position: 2, status: QueueItemStatus.CREATED }
      ];

      mockQueueItemModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockItems)
      });

      const result = await service.getPerformerQueue(performerId);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
    });
  });

  describe('getUserQueueHistory', () => {
    it('should return paginated queue history for user', async () => {
      const userId = mockUserId.toString();
      const mockItems = [
        { _id: new ObjectId(), createdAt: new Date(), status: QueueItemStatus.FINISHED },
        { _id: new ObjectId(), createdAt: new Date(), status: QueueItemStatus.REFUNDED }
      ];

      mockQueueItemModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockItems)
          })
        })
      });

      const result = await service.getUserQueueHistory(userId, 10, 0);

      expect(result).toHaveLength(2);
    });
  });
});
