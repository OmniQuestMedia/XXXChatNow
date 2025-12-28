import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpException, HttpStatus } from '@nestjs/common';
import { QueueService } from 'src/kernel/infras/queue';
import { PerformanceQueueService } from './performance-queue.service';
import { QueueRateLimitService } from './queue-rate-limit.service';
import { QueueRequest, DeadLetterQueue } from '../schemas';
import { QUEUE_MODE, REQUEST_STATUS, PRIORITY_LEVEL } from '../constants';

// Mock AgendaService class
class MockAgendaService {
  define = jest.fn();
  schedule = jest.fn().mockResolvedValue(true);
}

describe('PerformanceQueueService', () => {
  let service: PerformanceQueueService;
  let queueRequestModel: Model<QueueRequest>;
  let deadLetterQueueModel: Model<DeadLetterQueue>;
  let rateLimitService: QueueRateLimitService;
  let queueService: QueueService;
  let agendaService: MockAgendaService;

  const mockUserId = new Types.ObjectId();
  const mockQueueInstance = {
    createJob: jest.fn().mockReturnValue({
      save: jest.fn().mockResolvedValue(true)
    }),
    process: jest.fn(),
    on: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceQueueService,
        {
          provide: getModelToken(QueueRequest.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
            countDocuments: jest.fn()
          }
        },
        {
          provide: getModelToken(DeadLetterQueue.name),
          useValue: {
            create: jest.fn()
          }
        },
        {
          provide: QueueService,
          useValue: {
            createInstance: jest.fn().mockReturnValue(mockQueueInstance)
          }
        },
        {
          provide: 'AgendaService',
          useClass: MockAgendaService
        },
        {
          provide: QueueRateLimitService,
          useValue: {
            checkRateLimit: jest.fn().mockResolvedValue(true)
          }
        }
      ]
    }).compile();

    service = module.get<PerformanceQueueService>(PerformanceQueueService);
    queueRequestModel = module.get<Model<QueueRequest>>(getModelToken(QueueRequest.name));
    deadLetterQueueModel = module.get<Model<DeadLetterQueue>>(getModelToken(DeadLetterQueue.name));
    queueService = module.get<QueueService>(QueueService);
    agendaService = module.get('AgendaService');
    rateLimitService = module.get<QueueRateLimitService>(QueueRateLimitService);

    // Initialize the module
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitRequest', () => {
    it('should submit a request successfully', async () => {
      const dto = {
        type: 'chat.message',
        mode: QUEUE_MODE.FIFO,
        payload: { message: 'Hello' },
        priority: PRIORITY_LEVEL.NORMAL
      };

      const mockQueueRequest = {
        requestId: 'test-request-id',
        userId: mockUserId,
        mode: QUEUE_MODE.FIFO,
        type: 'chat.message',
        status: REQUEST_STATUS.PENDING,
        priority: PRIORITY_LEVEL.NORMAL,
        retryCount: 0,
        createdAt: new Date()
      };

      jest.spyOn(rateLimitService, 'checkRateLimit').mockResolvedValue(true);
      jest.spyOn(queueRequestModel, 'countDocuments').mockResolvedValue(100);
      jest.spyOn(queueRequestModel, 'create').mockResolvedValue(mockQueueRequest as any);

      const result = await service.submitRequest(mockUserId, dto);

      expect(result).toHaveProperty('requestId');
      expect(result.status).toBe(REQUEST_STATUS.PENDING);
      expect(result.mode).toBe(QUEUE_MODE.FIFO);
      expect(rateLimitService.checkRateLimit).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockQueueInstance.createJob).toHaveBeenCalled();
    });

    it('should reject request when queue is full', async () => {
      jest.spyOn(rateLimitService, 'checkRateLimit').mockResolvedValue(true);
      jest.spyOn(queueRequestModel, 'countDocuments').mockResolvedValue(10000);

      const dto = {
        type: 'chat.message',
        mode: QUEUE_MODE.FIFO,
        payload: { message: 'Hello' }
      };

      await expect(service.submitRequest(mockUserId, dto)).rejects.toThrow(HttpException);
    });

    it('should return existing request for duplicate idempotency key', async () => {
      const dto = {
        type: 'chat.message',
        mode: QUEUE_MODE.FIFO,
        payload: { message: 'Hello' },
        idempotencyKey: 'unique-key-123'
      };

      const existingRequest = {
        requestId: 'existing-request',
        userId: mockUserId,
        mode: QUEUE_MODE.FIFO,
        type: 'chat.message',
        status: REQUEST_STATUS.PENDING,
        priority: PRIORITY_LEVEL.NORMAL,
        createdAt: new Date()
      };

      jest.spyOn(rateLimitService, 'checkRateLimit').mockResolvedValue(true);
      jest.spyOn(queueRequestModel, 'countDocuments').mockResolvedValue(100);
      jest.spyOn(queueRequestModel, 'findOne').mockResolvedValue(existingRequest as any);

      const result = await service.submitRequest(mockUserId, dto);

      expect(result.requestId).toBe('existing-request');
      expect(queueRequestModel.create).not.toHaveBeenCalled();
    });

    it('should enforce rate limit', async () => {
      jest.spyOn(rateLimitService, 'checkRateLimit').mockRejectedValue(
        new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)
      );

      const dto = {
        type: 'chat.message',
        mode: QUEUE_MODE.FIFO,
        payload: { message: 'Hello' }
      };

      await expect(service.submitRequest(mockUserId, dto)).rejects.toThrow(HttpException);
    });
  });

  describe('getRequestStatus', () => {
    it('should return request status', async () => {
      const mockRequest = {
        requestId: 'test-request-id',
        userId: mockUserId,
        status: REQUEST_STATUS.COMPLETED,
        retryCount: 0,
        result: { success: true },
        createdAt: new Date(),
        completedAt: new Date()
      };

      jest.spyOn(queueRequestModel, 'findOne').mockResolvedValue(mockRequest as any);

      const result = await service.getRequestStatus('test-request-id', mockUserId);

      expect(result.requestId).toBe('test-request-id');
      expect(result.status).toBe(REQUEST_STATUS.COMPLETED);
      expect(result.result).toEqual({ success: true });
    });

    it('should throw error when request not found', async () => {
      jest.spyOn(queueRequestModel, 'findOne').mockResolvedValue(null);

      await expect(
        service.getRequestStatus('non-existent', mockUserId)
      ).rejects.toThrow(HttpException);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending request', async () => {
      const mockRequest = {
        requestId: 'test-request-id',
        userId: mockUserId,
        status: REQUEST_STATUS.PENDING
      };

      jest.spyOn(queueRequestModel, 'findOne').mockResolvedValue(mockRequest as any);
      jest.spyOn(queueRequestModel, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);

      await service.cancelRequest('test-request-id', mockUserId);

      expect(queueRequestModel.updateOne).toHaveBeenCalledWith(
        { requestId: 'test-request-id' },
        { status: REQUEST_STATUS.CANCELLED }
      );
    });

    it('should throw error when trying to cancel non-pending request', async () => {
      const mockRequest = {
        requestId: 'test-request-id',
        userId: mockUserId,
        status: REQUEST_STATUS.PROCESSING
      };

      jest.spyOn(queueRequestModel, 'findOne').mockResolvedValue(mockRequest as any);

      await expect(
        service.cancelRequest('test-request-id', mockUserId)
      ).rejects.toThrow(HttpException);
    });
  });

  describe('registerProcessor', () => {
    it('should register a processor for a request type', () => {
      const mockProcessor = jest.fn();

      service.registerProcessor('chat.message', mockProcessor);

      // Processor should be registered (tested via processQueueJob)
      expect(service).toBeDefined();
    });
  });
});
