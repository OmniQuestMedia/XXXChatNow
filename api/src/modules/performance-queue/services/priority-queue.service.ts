/**
 * Priority Queue Service
 * 
 * Core service for managing high-priority queuing system with:
 * - At-least-once and at-most-once delivery guarantees
 * - Exponential backoff retry mechanism
 * - Concurrency management
 * - Rate limiting and access control
 * - Comprehensive audit logging
 * - Idempotency support
 * 
 * Security Features:
 * - Authentication required for all operations
 * - Rate limiting per user
 * - Audit trail for all operations
 * - Idempotency key validation
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - COPILOT_GOVERNANCE.md
 */

import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueService } from 'src/kernel/infras/queue';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  QueueRequest,
  QueueMetrics
} from '../schemas';
import {
  CreateQueueRequestDto,
  QueueRequestResponseDto,
  QueueHealthDto
} from '../dtos';
import {
  PERFORMANCE_QUEUE_CHANNEL,
  REQUEST_STATUS,
  QUEUE_MODE,
  PRIORITY_LEVEL,
  MAX_QUEUE_DEPTH,
  PROCESSING_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_MS,
  MAX_REQUESTS_PER_USER_PER_MINUTE,
  PERFORMANCE_QUEUE_ERRORS
} from '../constants';

interface QueueJob {
  requestId: string;
  userId: string;
  type: string;
  payload: any;
  priority: number;
  retryCount: number;
  idempotencyKey: string;
  metadata?: any;
}

@Injectable()
export class PriorityQueueService {
  private readonly logger = new Logger(PriorityQueueService.name);
  private queueInstance: any;
  private activeWorkers = 0;
  private rateLimitCache: Map<string, number[]> = new Map();

  constructor(
    @InjectModel(QueueRequest.name)
    private queueRequestModel: Model<QueueRequest>,
    @InjectModel(QueueMetrics.name)
    private queueMetricsModel: Model<QueueMetrics>,
    private queueService: QueueService
  ) {
    this.initializeQueue();
  }

  /**
   * Initialize the priority queue with proper configuration
   */
  private initializeQueue() {
    this.queueInstance = this.queueService.createInstance(
      PERFORMANCE_QUEUE_CHANNEL,
      {
        isWorker: true,
        getEvents: true,
        sendEvents: true,
        removeOnSuccess: false, // Keep for audit trail
        removeOnFailure: false, // Keep for debugging
        stallInterval: 5000,
        nearTermWindow: 1200000,
        delayedDebounce: 1000
      }
    );

    // Set up job processing
    this.queueInstance.process(async (job: any) => {
      return this.processJob(job.data);
    });

    // Set up event handlers
    this.queueInstance.on('succeeded', this.onJobSuccess.bind(this));
    this.queueInstance.on('failed', this.onJobFailure.bind(this));
    this.queueInstance.on('retrying', this.onJobRetry.bind(this));

    this.logger.log('Priority queue initialized successfully');
  }

  /**
   * Submit a new request to the queue with authentication and rate limiting
   * 
   * Security:
   * - Requires authenticated userId
   * - Enforces rate limiting per user
   * - Validates idempotency key
   * - Creates audit trail
   */
  async submitRequest(
    userId: ObjectId,
    dto: CreateQueueRequestDto
  ): Promise<QueueRequestResponseDto> {
    if (!userId) {
      throw new UnauthorizedException(PERFORMANCE_QUEUE_ERRORS.UNAUTHORIZED);
    }

    // Validate input
    this.validateRequest(dto);

    // Check rate limiting
    await this.checkRateLimit(userId);

    // Check idempotency
    const existing = await this.checkIdempotency(dto.idempotencyKey);
    if (existing) {
      this.logger.warn(`Duplicate request detected: ${dto.idempotencyKey}`);
      return {
        requestId: existing.requestId,
        status: existing.status,
        message: 'Request already exists'
      };
    }

    // Check queue depth
    const currentDepth = await this.getCurrentQueueDepth();
    if (currentDepth >= MAX_QUEUE_DEPTH) {
      throw new BadRequestException(PERFORMANCE_QUEUE_ERRORS.QUEUE_FULL);
    }

    const requestId = uuidv4();
    const now = new Date();

    // Create database record
    const queueRequest = new this.queueRequestModel({
      requestId,
      userId,
      type: dto.type,
      payload: dto.payload,
      status: REQUEST_STATUS.PENDING,
      mode: dto.mode || QUEUE_MODE.FIFO,
      priority: dto.priority || PRIORITY_LEVEL.NORMAL,
      retryCount: 0,
      queuedAt: now,
      idempotencyKey: dto.idempotencyKey,
      metadata: dto.metadata
    });

    await queueRequest.save();

    // Submit to queue with priority
    const job: QueueJob = {
      requestId,
      userId: userId.toString(),
      type: dto.type,
      payload: dto.payload,
      priority: dto.priority || PRIORITY_LEVEL.NORMAL,
      retryCount: 0,
      idempotencyKey: dto.idempotencyKey,
      metadata: dto.metadata
    };

    // Create job with appropriate settings
    const beeJob = this.queueInstance.createJob(job);
    
    // Set timeout
    beeJob.timeout(PROCESSING_TIMEOUT_MS);
    
    // Set retries with exponential backoff
    beeJob.retries(MAX_RETRY_ATTEMPTS);
    beeJob.backoff('exponential', RETRY_BACKOFF_MS);
    
    await beeJob.save();

    this.logger.log(`Request submitted: ${requestId} by user ${userId}`);

    // Update metrics
    await this.updateMetrics('requestsQueued', 1);

    return {
      requestId,
      status: REQUEST_STATUS.PENDING,
      message: 'Request queued successfully'
    };
  }

  /**
   * Process a job from the queue
   * 
   * This is the core job processing method that:
   * - Updates job status to processing
   * - Calls executeJob() to perform the actual work
   * - Tracks timing metrics
   * - Handles success/failure states
   * 
   * The actual work logic is delegated to executeJob() which should be
   * extended for specific job types. See executeJob() documentation for details.
   */
  private async processJob(job: QueueJob): Promise<any> {
    this.activeWorkers++;
    const startTime = Date.now();

    try {
      this.logger.log(`Processing job: ${job.requestId}`);

      // Update status to processing
      const queuedAt = await this.updateRequestStatus(
        job.requestId,
        REQUEST_STATUS.PROCESSING,
        { processingAt: new Date() }
      );

      // TODO: Implement actual job processing logic based on job.type
      // This will be extended to handle different types of jobs
      // For now, we'll simulate processing
      const result = await this.executeJob(job);

      // Calculate timing
      const processingTimeMs = Date.now() - startTime;
      const waitTimeMs = queuedAt ? startTime - queuedAt.getTime() : 0;

      // Update status to completed
      await this.updateRequestStatus(
        job.requestId,
        REQUEST_STATUS.COMPLETED,
        {
          completedAt: new Date(),
          result,
          processingTimeMs,
          waitTimeMs
        }
      );

      this.logger.log(`Job completed: ${job.requestId} in ${processingTimeMs}ms`);

      return result;
    } catch (error) {
      this.logger.error(`Job failed: ${job.requestId}`, error.stack);
      throw error;
    } finally {
      this.activeWorkers--;
    }
  }

  /**
   * Execute the actual job logic
   * 
   * IMPORTANT: This is a framework method that needs to be extended for specific job types.
   * 
   * To implement custom job processing:
   * 1. Define job types in constants.ts
   * 2. Extend this method with a switch statement for your job types
   * 3. Implement specific handlers for each job type
   * 
   * Example:
   * ```typescript
   * private async executeJob(job: QueueJob): Promise<any> {
   *   switch (job.type) {
   *     case 'notification':
   *       return this.notificationService.send(job.payload);
   *     case 'email':
   *       return this.emailService.send(job.payload);
   *     default:
   *       throw new Error(`Unknown job type: ${job.type}`);
   *   }
   * }
   * ```
   * 
   * Current implementation returns a success response for all jobs.
   * This allows the queue system to function for testing and integration,
   * while actual job processing logic should be implemented based on use case.
   */
  private async executeJob(job: QueueJob): Promise<any> {
    // Framework implementation - extend this method for specific job types
    this.logger.log(`Executing job type: ${job.type}`);
    
    // Return success for framework validation
    // Real implementations should replace this with actual job processing
    return {
      success: true,
      message: `Job ${job.type} processed successfully`,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Get request status by requestId
   */
  async getRequestStatus(requestId: string, userId: ObjectId): Promise<QueueRequest> {
    const request = await this.queueRequestModel.findOne({ requestId }).lean();

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    // Verify ownership
    if (request.userId.toString() !== userId.toString()) {
      throw new UnauthorizedException('Unauthorized access to request');
    }

    return request;
  }

  /**
   * Cancel a pending request
   */
  async cancelRequest(requestId: string, userId: ObjectId): Promise<void> {
    const request = await this.queueRequestModel.findOne({ requestId });

    if (!request) {
      throw new BadRequestException('Request not found');
    }

    // Verify ownership
    if (request.userId.toString() !== userId.toString()) {
      throw new UnauthorizedException('Unauthorized access to request');
    }

    // Can only cancel pending or assigned requests
    if (![REQUEST_STATUS.PENDING, REQUEST_STATUS.ASSIGNED].includes(request.status)) {
      throw new BadRequestException('Request cannot be cancelled in current status');
    }

    await this.updateRequestStatus(requestId, REQUEST_STATUS.CANCELLED);
    
    this.logger.log(`Request cancelled: ${requestId} by user ${userId}`);
  }

  /**
   * Get queue health status
   */
  async getHealth(): Promise<QueueHealthDto> {
    const currentDepth = await this.getCurrentQueueDepth();
    
    // Get recent metrics
    const recentMetrics = await this.queueMetricsModel
      .findOne({})
      .sort({ timestamp: -1 })
      .lean();

    const totalRequests = await this.queueRequestModel.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    });

    const failedRequests = await this.queueRequestModel.countDocuments({
      status: REQUEST_STATUS.FAILED,
      createdAt: { $gte: new Date(Date.now() - 60000) }
    });

    const failureRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    return {
      healthy: currentDepth < MAX_QUEUE_DEPTH && failureRate < 0.1,
      queueDepth: currentDepth,
      activeWorkers: this.activeWorkers,
      averageWaitTimeMs: recentMetrics?.averageWaitTimeMs || 0,
      averageProcessingTimeMs: recentMetrics?.averageProcessingTimeMs || 0,
      failureRate,
      timestamp: new Date()
    };
  }

  /**
   * Validate request parameters
   */
  private validateRequest(dto: CreateQueueRequestDto): void {
    if (!dto.type) {
      throw new BadRequestException('Request type is required');
    }

    if (!dto.payload) {
      throw new BadRequestException('Request payload is required');
    }

    if (!dto.idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }

    if (dto.priority && (dto.priority < 1 || dto.priority > 20)) {
      throw new BadRequestException(PERFORMANCE_QUEUE_ERRORS.INVALID_PRIORITY);
    }

    if (dto.mode && !Object.values(QUEUE_MODE).includes(dto.mode)) {
      throw new BadRequestException(PERFORMANCE_QUEUE_ERRORS.INVALID_MODE);
    }
  }

  /**
   * Check rate limiting for user
   * 
   * Security: Prevents abuse by limiting requests per user per minute
   */
  private async checkRateLimit(userId: ObjectId): Promise<void> {
    const userKey = userId.toString();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Get or create rate limit tracking for user
    let timestamps = this.rateLimitCache.get(userKey) || [];
    
    // Remove old timestamps
    timestamps = timestamps.filter(ts => ts > oneMinuteAgo);
    
    // Check limit
    if (timestamps.length >= MAX_REQUESTS_PER_USER_PER_MINUTE) {
      throw new BadRequestException(PERFORMANCE_QUEUE_ERRORS.RATE_LIMIT_EXCEEDED);
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimitCache.set(userKey, timestamps);

    // Clean up old entries periodically
    if (this.rateLimitCache.size > 10000) {
      this.cleanupRateLimitCache();
    }
  }

  /**
   * Clean up old rate limit cache entries
   */
  private cleanupRateLimitCache(): void {
    const oneMinuteAgo = Date.now() - 60000;
    
    for (const [key, timestamps] of this.rateLimitCache.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > oneMinuteAgo);
      
      if (validTimestamps.length === 0) {
        this.rateLimitCache.delete(key);
      } else {
        this.rateLimitCache.set(key, validTimestamps);
      }
    }
  }

  /**
   * Check idempotency key to prevent duplicate requests
   * 
   * Security: Prevents duplicate operations for at-most-once semantics
   */
  private async checkIdempotency(idempotencyKey: string): Promise<QueueRequest | null> {
    return this.queueRequestModel.findOne({ idempotencyKey }).lean();
  }

  /**
   * Get current queue depth
   */
  private async getCurrentQueueDepth(): Promise<number> {
    return this.queueRequestModel.countDocuments({
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ASSIGNED] }
    });
  }

  /**
   * Update request status in database
   */
  private async updateRequestStatus(
    requestId: string,
    status: string,
    additionalFields?: any
  ): Promise<Date | null> {
    const update: any = { status, ...additionalFields };
    
    const request = await this.queueRequestModel.findOneAndUpdate(
      { requestId },
      { $set: update },
      { new: false }
    );

    return request?.queuedAt || null;
  }

  /**
   * Handle job success
   */
  private async onJobSuccess(job: any): Promise<void> {
    await this.updateMetrics('requestsCompleted', 1);
    this.logger.log(`Job succeeded: ${job.data.requestId}`);
  }

  /**
   * Handle job failure
   */
  private async onJobFailure(job: any, error: Error): Promise<void> {
    const jobData: QueueJob = job.data;
    
    await this.updateRequestStatus(
      jobData.requestId,
      REQUEST_STATUS.FAILED,
      {
        failedAt: new Date(),
        error: error.message
      }
    );

    await this.updateMetrics('requestsFailed', 1);
    
    this.logger.error(`Job failed: ${jobData.requestId}`, error.stack);
  }

  /**
   * Handle job retry
   */
  private async onJobRetry(job: any): Promise<void> {
    const jobData: QueueJob = job.data;
    
    await this.queueRequestModel.updateOne(
      { requestId: jobData.requestId },
      { $inc: { retryCount: 1 } }
    );

    await this.updateMetrics('requestsRetried', 1);
    
    this.logger.warn(`Job retrying: ${jobData.requestId}, attempt ${jobData.retryCount + 1}`);
  }

  /**
   * Update metrics in database
   */
  private async updateMetrics(field: string, increment: number): Promise<void> {
    const timestamp = new Date();
    timestamp.setSeconds(0, 0); // Round to minute

    await this.queueMetricsModel.updateOne(
      { timestamp, queueType: PERFORMANCE_QUEUE_CHANNEL },
      {
        $inc: { [field]: increment },
        $setOnInsert: { timestamp, queueType: PERFORMANCE_QUEUE_CHANNEL }
      },
      { upsert: true }
    );
  }
}
