import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { HttpException } from '@nestjs/common';
import { QueueRateLimitService } from './queue-rate-limit.service';

describe('QueueRateLimitService', () => {
  let service: QueueRateLimitService;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      incr: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
      del: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueRateLimitService,
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedis)
          }
        }
      ]
    }).compile();

    service = module.get<QueueRateLimitService>(QueueRateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRateLimit', () => {
    it('should allow request within rate limit', async () => {
      mockRedis.incr.mockResolvedValue(1);

      const result = await service.checkRateLimit('user-123', 60);

      expect(result).toBe(true);
      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should throw exception when rate limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(61);

      await expect(service.checkRateLimit('user-123', 60)).rejects.toThrow(HttpException);
    });

    it('should set expiration on first request', async () => {
      mockRedis.incr.mockResolvedValue(1);

      await service.checkRateLimit('user-123', 60);

      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 120);
    });

    it('should not set expiration on subsequent requests', async () => {
      mockRedis.incr.mockResolvedValue(5);

      await service.checkRateLimit('user-123', 60);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should handle Redis failure gracefully', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.checkRateLimit('user-123', 60);

      expect(result).toBe(true); // Allow request when Redis fails
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current rate limit status', async () => {
      mockRedis.get.mockResolvedValue('30');

      const result = await service.getRateLimitStatus('user-123', 60);

      expect(result.current).toBe(30);
      expect(result.remaining).toBe(30);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should return zero when no requests made', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getRateLimitStatus('user-123', 60);

      expect(result.current).toBe(0);
      expect(result.remaining).toBe(60);
    });

    it('should handle Redis failure gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.getRateLimitStatus('user-123', 60);

      expect(result.current).toBe(0);
      expect(result.remaining).toBe(60);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for user', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.resetRateLimit('user-123');

      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should handle Redis failure gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.resetRateLimit('user-123')).resolves.not.toThrow();
    });
  });
});
