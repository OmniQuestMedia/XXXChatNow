import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueHealthService } from './queue-health.service';
import { QueueRequest, DeadLetterQueue } from '../schemas';
import { REQUEST_STATUS } from '../constants';

describe('QueueHealthService', () => {
  let service: QueueHealthService;
  let queueRequestModel: Model<QueueRequest>;
  let deadLetterQueueModel: Model<DeadLetterQueue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueHealthService,
        {
          provide: getModelToken(QueueRequest.name),
          useValue: {
            countDocuments: jest.fn(),
            find: jest.fn(),
            distinct: jest.fn()
          }
        },
        {
          provide: getModelToken(DeadLetterQueue.name),
          useValue: {
            countDocuments: jest.fn(),
            find: jest.fn(),
            updateOne: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<QueueHealthService>(QueueHealthService);
    queueRequestModel = module.get<Model<QueueRequest>>(getModelToken(QueueRequest.name));
    deadLetterQueueModel = module.get<Model<DeadLetterQueue>>(getModelToken(DeadLetterQueue.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when metrics are good', async () => {
      jest.spyOn(queueRequestModel, 'countDocuments')
        .mockResolvedValueOnce(100) // pending
        .mockResolvedValueOnce(10)  // processing
        .mockResolvedValueOnce(5);  // recent failures

      jest.spyOn(deadLetterQueueModel, 'countDocuments').mockResolvedValue(5);

      jest.spyOn(queueRequestModel, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            processingStartedAt: new Date(Date.now() - 5000),
            completedAt: new Date()
          }
        ])
      } as any);

      jest.spyOn(queueRequestModel, 'distinct').mockResolvedValue(['worker-1', 'worker-2']);

      const result = await service.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.pendingCount).toBe(100);
      expect(result.processingCount).toBe(10);
      expect(result.activeWorkers).toBe(2);
      expect(result.dlqSize).toBe(5);
      expect(result.capacityUtilization).toBe(1); // 100/10000 * 100
    });

    it('should return degraded status when metrics show warning signs', async () => {
      jest.spyOn(queueRequestModel, 'countDocuments')
        .mockResolvedValueOnce(7500) // pending (75% capacity)
        .mockResolvedValueOnce(50)   // processing
        .mockResolvedValueOnce(60);  // recent failures

      jest.spyOn(deadLetterQueueModel, 'countDocuments').mockResolvedValue(25);

      jest.spyOn(queueRequestModel, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      } as any);

      jest.spyOn(queueRequestModel, 'distinct').mockResolvedValue(['worker-1']);

      const result = await service.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.capacityUtilization).toBe(75);
    });

    it('should return unhealthy status when metrics are critical', async () => {
      jest.spyOn(queueRequestModel, 'countDocuments')
        .mockResolvedValueOnce(9500) // pending (95% capacity)
        .mockResolvedValueOnce(100)  // processing
        .mockResolvedValueOnce(150); // recent failures

      jest.spyOn(deadLetterQueueModel, 'countDocuments').mockResolvedValue(60);

      jest.spyOn(queueRequestModel, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      } as any);

      jest.spyOn(queueRequestModel, 'distinct').mockResolvedValue([]);

      const result = await service.getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.capacityUtilization).toBe(95);
    });
  });

  describe('getMetrics', () => {
    it('should calculate metrics for time period', async () => {
      jest.spyOn(queueRequestModel, 'countDocuments')
        .mockResolvedValueOnce(100) // submitted
        .mockResolvedValueOnce(90)  // completed
        .mockResolvedValueOnce(5);  // failed

      const mockRequests = [
        {
          createdAt: new Date(Date.now() - 10000),
          processingStartedAt: new Date(Date.now() - 5000),
          completedAt: new Date()
        }
      ];

      jest.spyOn(queueRequestModel, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockRequests)
      } as any);

      const result = await service.getMetrics(60);

      expect(result.totalSubmitted).toBe(100);
      expect(result.totalCompleted).toBe(90);
      expect(result.totalFailed).toBe(5);
      expect(result.successRate).toBe(95); // 90/(90+5) * 100
      expect(result.period).toBe('60 minutes');
    });

    it('should handle empty time period', async () => {
      jest.spyOn(queueRequestModel, 'countDocuments')
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      jest.spyOn(queueRequestModel, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      } as any);

      const result = await service.getMetrics(60);

      expect(result.totalSubmitted).toBe(0);
      expect(result.totalCompleted).toBe(0);
      expect(result.successRate).toBe(100);
    });
  });

  describe('getDeadLetterQueueEntries', () => {
    it('should return unreviewed DLQ entries', async () => {
      const mockEntries = [
        { _id: '1', originalRequestId: 'req-1', reviewed: false },
        { _id: '2', originalRequestId: 'req-2', reviewed: false }
      ];

      jest.spyOn(deadLetterQueueModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockEntries)
          })
        })
      } as any);

      const result = await service.getDeadLetterQueueEntries(50);

      expect(result).toEqual(mockEntries);
    });
  });

  describe('markDLQAsReviewed', () => {
    it('should mark DLQ entry as reviewed', async () => {
      jest.spyOn(deadLetterQueueModel, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);

      await service.markDLQAsReviewed('dlq-123', 'admin-456', 'Fixed manually');

      expect(deadLetterQueueModel.updateOne).toHaveBeenCalledWith(
        { _id: 'dlq-123' },
        expect.objectContaining({
          reviewed: true,
          reviewedBy: 'admin-456',
          resolution: 'Fixed manually'
        })
      );
    });
  });
});
