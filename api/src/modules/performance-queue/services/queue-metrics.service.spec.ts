/**
 * Queue Metrics Service Tests
 * 
 * Tests for queue performance monitoring and analytics.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueMetricsService } from './queue-metrics.service';
import { QueueRequest, QueueMetrics } from '../schemas';
import { REQUEST_STATUS } from '../constants';

describe('QueueMetricsService', () => {
  let service: QueueMetricsService;
  let queueRequestModel: Model<QueueRequest>;
  let queueMetricsModel: Model<QueueMetrics>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueMetricsService,
        {
          provide: getModelToken(QueueRequest.name),
          useValue: {
            find: jest.fn(),
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            updateMany: jest.fn()
          }
        },
        {
          provide: getModelToken(QueueMetrics.name),
          useValue: {
            countDocuments: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<QueueMetricsService>(QueueMetricsService);
    queueRequestModel = module.get<Model<QueueRequest>>(getModelToken(QueueRequest.name));
    queueMetricsModel = module.get<Model<QueueMetrics>>(getModelToken(QueueMetrics.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should calculate metrics for a time range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const mockRequests = [
        {
          status: REQUEST_STATUS.COMPLETED,
          waitTimeMs: 100,
          processingTimeMs: 200,
          createdAt: new Date('2024-01-01T12:00:00')
        },
        {
          status: REQUEST_STATUS.COMPLETED,
          waitTimeMs: 150,
          processingTimeMs: 250,
          createdAt: new Date('2024-01-01T13:00:00')
        },
        {
          status: REQUEST_STATUS.FAILED,
          waitTimeMs: 120,
          processingTimeMs: 180,
          createdAt: new Date('2024-01-01T14:00:00')
        }
      ];

      (queueRequestModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRequests)
      });

      const metrics = await service.getMetrics(startDate, endDate);

      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.completedRequests).toBe(2);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.averageWaitTimeMs).toBeGreaterThan(0);
      expect(metrics.averageProcessingTimeMs).toBeGreaterThan(0);
      expect(metrics.failureRate).toBeCloseTo(33.33, 1);
    });

    it('should handle empty results', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      (queueRequestModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      const metrics = await service.getMetrics(startDate, endDate);

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.completedRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.averageWaitTimeMs).toBe(0);
      expect(metrics.averageProcessingTimeMs).toBe(0);
      expect(metrics.throughputPerMinute).toBe(0);
    });
  });

  describe('getHourlyMetrics', () => {
    it('should get metrics for the last hour', async () => {
      const mockRequests = [
        {
          status: REQUEST_STATUS.COMPLETED,
          waitTimeMs: 100,
          processingTimeMs: 200,
          createdAt: new Date()
        }
      ];

      (queueRequestModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRequests)
      });

      const metrics = await service.getHourlyMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBe(1);
    });
  });

  describe('getDailyMetrics', () => {
    it('should get metrics for the last 24 hours', async () => {
      const mockRequests = [
        {
          status: REQUEST_STATUS.COMPLETED,
          waitTimeMs: 100,
          processingTimeMs: 200,
          createdAt: new Date()
        }
      ];

      (queueRequestModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRequests)
      });

      const metrics = await service.getDailyMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBe(1);
    });
  });

  describe('getDetailedMetrics', () => {
    it('should return metrics breakdown by status', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const mockAggregateResult = [
        {
          _id: REQUEST_STATUS.COMPLETED,
          count: 10,
          avgWaitTime: 100,
          avgProcessingTime: 200,
          maxWaitTime: 150,
          maxProcessingTime: 300
        },
        {
          _id: REQUEST_STATUS.FAILED,
          count: 2,
          avgWaitTime: 120,
          avgProcessingTime: 180,
          maxWaitTime: 140,
          maxProcessingTime: 250
        }
      ];

      (queueRequestModel.aggregate as jest.Mock).mockResolvedValue(mockAggregateResult);

      const detailed = await service.getDetailedMetrics(startDate, endDate);

      expect(detailed).toBeDefined();
      expect(detailed.breakdown).toHaveLength(2);
      expect(detailed.breakdown[0].status).toBe(REQUEST_STATUS.COMPLETED);
      expect(detailed.breakdown[0].count).toBe(10);
    });
  });

  describe('getMetricsByType', () => {
    it('should return metrics breakdown by job type', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const mockAggregateResult = [
        {
          _id: 'notification',
          total: 100,
          completed: 95,
          failed: 5,
          avgProcessingTime: 150
        },
        {
          _id: 'message',
          total: 50,
          completed: 48,
          failed: 2,
          avgProcessingTime: 200
        }
      ];

      (queueRequestModel.aggregate as jest.Mock).mockResolvedValue(mockAggregateResult);

      const byType = await service.getMetricsByType(startDate, endDate);

      expect(byType).toBeDefined();
      expect(byType.byType).toHaveLength(2);
      expect(byType.byType[0].type).toBe('notification');
      expect(byType.byType[0].successRate).toBe(95);
    });
  });

  describe('archiveOldMetrics', () => {
    it('should count metrics to archive', async () => {
      const olderThan = new Date('2023-01-01');

      (queueMetricsModel.countDocuments as jest.Mock).mockResolvedValue(100);

      const count = await service.archiveOldMetrics(olderThan);

      expect(count).toBe(100);
      expect(queueMetricsModel.countDocuments).toHaveBeenCalledWith({
        timestamp: { $lt: olderThan }
      });
    });
  });

  describe('cleanupOldRequests', () => {
    it('should mark old completed requests as archived', async () => {
      const olderThan = new Date('2023-01-01');

      (queueRequestModel.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 50
      });

      const count = await service.cleanupOldRequests(olderThan);

      expect(count).toBe(50);
      expect(queueRequestModel.updateMany).toHaveBeenCalled();
    });
  });
});
