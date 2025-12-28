/**
 * Priority Queue Service Tests
 * 
 * Tests for the high-priority queuing system with security and reliability features.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PriorityQueueService } from './priority-queue.service';
import { QueueService } from 'src/kernel/infras/queue';
import { QueueRequest, QueueMetrics } from '../schemas';
import { CreateQueueRequestDto } from '../dtos';
import { REQUEST_STATUS, QUEUE_MODE, PRIORITY_LEVEL, PERFORMANCE_QUEUE_ERRORS } from '../constants';

describe('PriorityQueueService', () => {
  let service: PriorityQueueService;
  let queueRequestModel: Model<QueueRequest>;
  let queueMetricsModel: Model<QueueMetrics>;

  const mockUserId = new ObjectId();
  const mockQueueInstance = {
    createJob: jest.fn().mockReturnValue({
      timeout: jest.fn().mockReturnThis(),
      retries: jest.fn().mockReturnThis(),
      backoff: jest.fn().mockReturnThis(),
      save: jest.fn().mockResolvedValue({})
    }),
    process: jest.fn(),
    on: jest.fn()
  };

  beforeEach(async () => {
    // Create a mock constructor for QueueRequest
    const mockQueueRequestConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...data, _id: 'mock-id' })
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriorityQueueService,
        {
          provide: getModelToken(QueueRequest.name),
          useValue: Object.assign(mockQueueRequestConstructor, {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            countDocuments: jest.fn(),
            updateOne: jest.fn()
          })
        },
        {
          provide: getModelToken(QueueMetrics.name),
          useValue: {
            updateOne: jest.fn(),
            findOne: jest.fn()
          }
        },
        {
          provide: QueueService,
          useValue: {
            createInstance: jest.fn().mockReturnValue(mockQueueInstance)
          }
        }
      ]
    }).compile();

    service = module.get<PriorityQueueService>(PriorityQueueService);
    queueRequestModel = module.get<Model<QueueRequest>>(getModelToken(QueueRequest.name));
    queueMetricsModel = module.get<Model<QueueMetrics>>(getModelToken(QueueMetrics.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitRequest', () => {
    const validDto: CreateQueueRequestDto = {
      type: 'test-job',
      payload: { data: 'test' },
      mode: QUEUE_MODE.FIFO,
      priority: PRIORITY_LEVEL.NORMAL,
      idempotencyKey: 'test-key-123',
      metadata: {}
    };

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Setup default mocks with lean() chaining
      (queueRequestModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      (queueRequestModel.countDocuments as jest.Mock).mockResolvedValue(0);
    });

    it('should submit a request successfully', async () => {
      const result = await service.submitRequest(mockUserId, validDto);

      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.status).toBe(REQUEST_STATUS.PENDING);
      expect(result.message).toBe('Request queued successfully');
    });

    it('should throw UnauthorizedException if userId is not provided', async () => {
      await expect(service.submitRequest(null, validDto))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if type is missing', async () => {
      const invalidDto = { ...validDto, type: '' };
      
      await expect(service.submitRequest(mockUserId, invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payload is missing', async () => {
      const invalidDto = { ...validDto, payload: null };
      
      await expect(service.submitRequest(mockUserId, invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if idempotencyKey is missing', async () => {
      const invalidDto = { ...validDto, idempotencyKey: '' };
      
      await expect(service.submitRequest(mockUserId, invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid priority', async () => {
      const invalidDto = { ...validDto, priority: 25 }; // Max is 20
      
      await expect(service.submitRequest(mockUserId, invalidDto))
        .rejects.toThrow(PERFORMANCE_QUEUE_ERRORS.INVALID_PRIORITY);
    });

    it('should throw BadRequestException for invalid mode', async () => {
      const invalidDto = { ...validDto, mode: 'invalid-mode' };
      
      await expect(service.submitRequest(mockUserId, invalidDto))
        .rejects.toThrow(PERFORMANCE_QUEUE_ERRORS.INVALID_MODE);
    });

    it('should handle duplicate idempotency key', async () => {
      const existingRequest = {
        requestId: 'existing-123',
        status: REQUEST_STATUS.COMPLETED,
        idempotencyKey: validDto.idempotencyKey
      };

      (queueRequestModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingRequest)
      });

      const result = await service.submitRequest(mockUserId, validDto);

      expect(result.requestId).toBe('existing-123');
      expect(result.status).toBe(REQUEST_STATUS.COMPLETED);
      expect(result.message).toBe('Request already exists');
    });

    it('should enforce rate limiting', async () => {
      // Submit 60 requests (the limit per minute)
      const promises = [];
      for (let i = 0; i < 60; i++) {
        const dto = { ...validDto, idempotencyKey: `key-${i}` };
        promises.push(service.submitRequest(mockUserId, dto));
      }

      await Promise.all(promises);

      // The 61st request should fail
      const dto61 = { ...validDto, idempotencyKey: 'key-61' };
      await expect(service.submitRequest(mockUserId, dto61))
        .rejects.toThrow(PERFORMANCE_QUEUE_ERRORS.RATE_LIMIT_EXCEEDED);
    });

    it('should throw BadRequestException when queue is full', async () => {
      (queueRequestModel.countDocuments as jest.Mock).mockResolvedValue(10000); // MAX_QUEUE_DEPTH

      await expect(service.submitRequest(mockUserId, validDto))
        .rejects.toThrow(PERFORMANCE_QUEUE_ERRORS.QUEUE_FULL);
    });
  });

  describe('getRequestStatus', () => {
    it('should return request status for owner', async () => {
      const mockRequest = {
        requestId: 'test-123',
        userId: mockUserId,
        status: REQUEST_STATUS.PROCESSING
      };

      (queueRequestModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRequest)
      });

      const result = await service.getRequestStatus('test-123', mockUserId);

      expect(result).toBeDefined();
      expect(result.requestId).toBe('test-123');
    });

    it('should throw BadRequestException if request not found', async () => {
      (queueRequestModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      await expect(service.getRequestStatus('non-existent', mockUserId))
        .rejects.toThrow('Request not found');
    });

    it('should throw UnauthorizedException for non-owner', async () => {
      const otherUserId = new ObjectId();
      const mockRequest = {
        requestId: 'test-123',
        userId: otherUserId,
        status: REQUEST_STATUS.PROCESSING
      };

      (queueRequestModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRequest)
      });

      await expect(service.getRequestStatus('test-123', mockUserId))
        .rejects.toThrow('Unauthorized access to request');
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending request', async () => {
      const mockRequest = {
        requestId: 'test-123',
        userId: mockUserId,
        status: REQUEST_STATUS.PENDING
      };

      (queueRequestModel.findOne as jest.Mock).mockResolvedValue(mockRequest);
      (queueRequestModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockRequest);

      await service.cancelRequest('test-123', mockUserId);

      expect(queueRequestModel.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should throw BadRequestException if request not found', async () => {
      (queueRequestModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelRequest('non-existent', mockUserId))
        .rejects.toThrow('Request not found');
    });

    it('should throw UnauthorizedException for non-owner', async () => {
      const otherUserId = new ObjectId();
      const mockRequest = {
        requestId: 'test-123',
        userId: otherUserId,
        status: REQUEST_STATUS.PENDING
      };

      (queueRequestModel.findOne as jest.Mock).mockResolvedValue(mockRequest);

      await expect(service.cancelRequest('test-123', mockUserId))
        .rejects.toThrow('Unauthorized access to request');
    });

    it('should throw BadRequestException if request is already processing', async () => {
      const mockRequest = {
        requestId: 'test-123',
        userId: mockUserId,
        status: REQUEST_STATUS.PROCESSING
      };

      (queueRequestModel.findOne as jest.Mock).mockResolvedValue(mockRequest);

      await expect(service.cancelRequest('test-123', mockUserId))
        .rejects.toThrow('Request cannot be cancelled in current status');
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      (queueRequestModel.countDocuments as jest.Mock).mockResolvedValue(10);
      (queueMetricsModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          averageWaitTimeMs: 100,
          averageProcessingTimeMs: 200
        })
      });

      const health = await service.getHealth();

      expect(health).toBeDefined();
      expect(health.healthy).toBeDefined();
      expect(health.queueDepth).toBe(10);
      expect(health.timestamp).toBeDefined();
    });

    it('should report unhealthy when queue is full', async () => {
      (queueRequestModel.countDocuments as jest.Mock).mockResolvedValue(10000); // MAX_QUEUE_DEPTH
      (queueMetricsModel.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });

      const health = await service.getHealth();

      expect(health.healthy).toBe(false);
      expect(health.queueDepth).toBe(10000);
    });
  });
});
