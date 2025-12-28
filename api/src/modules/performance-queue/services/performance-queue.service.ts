/**
 * Performance Queue Service
 * 
 * Main service for managing queue operations including submission, processing, and status tracking.
 * Supports FIFO, Priority, and Batch processing modes.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - COPILOT_GOVERNANCE.md
 */

import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { QueueService } from 'src/kernel/infras/queue';
import { QueueRequest, DeadLetterQueue } from '../schemas';
import { QueueRateLimitService } from './queue-rate-limit.service';
import {
  SubmitQueueRequestDto,
  QueueRequestResponseDto,
  QueueRequestStatusDto
} from '../dtos';
import {
  QUEUE_MODE,
  REQUEST_STATUS,
  PRIORITY_LEVEL,
  MAX_QUEUE_DEPTH,
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_MS,
  PERFORMANCE_QUEUE_ERRORS,
  PERFORMANCE_QUEUE_CHANNEL
} from '../constants';

@Injectable()
export class PerformanceQueueService implements OnModuleInit {
  private queueInstance: any;
  private processorMap: Map<string, Function> = new Map();

  constructor(
    @InjectModel(QueueRequest.name) private queueRequestModel: Model<QueueRequest>,
    @InjectModel(DeadLetterQueue.name) private deadLetterQueueModel: Model<DeadLetterQueue>,
    private readonly queueService: QueueService,
    private readonly rateLimitService: QueueRateLimitService
  ) {}

  async onModuleInit() {
    // Initialize queue instance
    this.queueInstance = this.queueService.createInstance(PERFORMANCE_QUEUE_CHANNEL);

    // Set up queue processor
    this.queueInstance.process(async (job: any) => {
      await this.processQueueJob(job.data);
    });

    // Set up event handlers
    this.queueInstance.on('succeeded', async (job: any, result: any) => {
      await this.handleJobSuccess(job.data.requestId, result);
    });

    this.queueInstance.on('failed', async (job: any, error: Error) => {
      await this.handleJobFailure(job.data.requestId, error);
    });
  }

  /**
   * Submit a new request to the queue
   * Server-side validation and authentication required
   */
  async submitRequest(
    userId: Types.ObjectId,
    dto: SubmitQueueRequestDto
  ): Promise<QueueRequestResponseDto> {
    // Check rate limit
    await this.rateLimitService.checkRateLimit(userId.toString());

    // Check queue depth
    const pendingCount = await this.queueRequestModel.countDocuments({
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ASSIGNED] }
    });

    if (pendingCount >= MAX_QUEUE_DEPTH) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Queue is at maximum capacity. Please try again later.',
          error: PERFORMANCE_QUEUE_ERRORS.QUEUE_FULL
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // Check for duplicate using idempotency key
    if (dto.idempotencyKey) {
      const existing = await this.queueRequestModel.findOne({
        idempotencyKey: dto.idempotencyKey,
        userId
      });

      if (existing) {
        // Return existing request instead of creating duplicate
        return this.mapToResponseDto(existing);
      }
    }

    // Create queue request record
    const requestId = uuidv4();
    const queueRequest = await this.queueRequestModel.create({
      requestId,
      userId,
      mode: dto.mode || QUEUE_MODE.FIFO,
      type: dto.type,
      payload: dto.payload,
      status: REQUEST_STATUS.PENDING,
      priority: dto.priority || PRIORITY_LEVEL.NORMAL,
      retryCount: 0,
      idempotencyKey: dto.idempotencyKey,
      metadata: dto.metadata
    });

    // Submit to bee-queue for processing
    const jobOptions: any = {
      timeout: 60000, // 60 second timeout
      retries: 0 // We handle retries manually for better control
    };

    // For priority queue mode, use job priority
    if (dto.mode === QUEUE_MODE.PRIORITY) {
      jobOptions.priority = dto.priority || PRIORITY_LEVEL.NORMAL;
    }

    await this.queueInstance.createJob({
      requestId,
      userId: userId.toString(),
      type: dto.type,
      payload: dto.payload,
      mode: dto.mode || QUEUE_MODE.FIFO
    }).save();

    // Calculate estimated queue position (approximate)
    const queuePosition = await this.queueRequestModel.countDocuments({
      status: REQUEST_STATUS.PENDING,
      createdAt: { $lt: queueRequest.createdAt }
    });

    return {
      requestId: queueRequest.requestId,
      status: queueRequest.status,
      mode: queueRequest.mode,
      type: queueRequest.type,
      priority: queueRequest.priority,
      createdAt: queueRequest.createdAt,
      queuePosition: queuePosition + 1
    };
  }

  /**
   * Get status of a queue request
   */
  async getRequestStatus(requestId: string, userId: Types.ObjectId): Promise<QueueRequestStatusDto> {
    const request = await this.queueRequestModel.findOne({ requestId, userId });

    if (!request) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Queue request not found',
          error: 'NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    return {
      requestId: request.requestId,
      status: request.status,
      retryCount: request.retryCount,
      workerId: request.workerId,
      error: request.error,
      result: request.result,
      createdAt: request.createdAt,
      completedAt: request.completedAt
    };
  }

  /**
   * Register a processor for a specific request type
   */
  registerProcessor(type: string, processor: Function): void {
    this.processorMap.set(type, processor);
  }

  /**
   * Process a queue job
   */
  private async processQueueJob(jobData: any): Promise<any> {
    const { requestId, type, payload } = jobData;

    // Update status to processing
    await this.queueRequestModel.updateOne(
      { requestId },
      {
        status: REQUEST_STATUS.PROCESSING,
        processingStartedAt: new Date()
      }
    );

    // Get registered processor
    const processor = this.processorMap.get(type);

    if (!processor) {
      throw new Error(`No processor registered for type: ${type}`);
    }

    // Execute processor
    const result = await processor(payload);

    return result;
  }

  /**
   * Handle successful job completion
   */
  private async handleJobSuccess(requestId: string, result: any): Promise<void> {
    await this.queueRequestModel.updateOne(
      { requestId },
      {
        status: REQUEST_STATUS.COMPLETED,
        result,
        completedAt: new Date()
      }
    );
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(requestId: string, error: Error): Promise<void> {
    const request = await this.queueRequestModel.findOne({ requestId });

    if (!request) {
      console.error(`Request not found for retry: ${requestId}`);
      return;
    }

    const retryCount = request.retryCount + 1;

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      // Retry with exponential backoff
      const backoffMs = RETRY_BACKOFF_MS * Math.pow(2, retryCount);

      await this.queueRequestModel.updateOne(
        { requestId },
        {
          status: REQUEST_STATUS.PENDING,
          retryCount,
          error: error.message
        }
      );

      // Resubmit to queue after backoff
      setTimeout(async () => {
        await this.queueInstance.createJob({
          requestId: request.requestId,
          userId: request.userId.toString(),
          type: request.type,
          payload: request.payload,
          mode: request.mode
        }).save();
      }, backoffMs);
    } else {
      // Max retries exceeded, move to dead letter queue
      await this.moveToDeadLetterQueue(request, error);

      await this.queueRequestModel.updateOne(
        { requestId },
        {
          status: REQUEST_STATUS.FAILED,
          error: error.message,
          failedAt: new Date()
        }
      );
    }
  }

  /**
   * Move failed request to dead letter queue
   */
  private async moveToDeadLetterQueue(request: QueueRequest, error: Error): Promise<void> {
    try {
      await this.deadLetterQueueModel.create({
        originalRequestId: request.requestId,
        userId: request.userId,
        mode: request.mode,
        type: request.type,
        originalPayload: request.payload,
        failureReason: error.message,
        attemptCount: request.retryCount + 1,
        errorHistory: [error.message], // Could be enhanced to track all error messages
        firstAttemptAt: request.createdAt,
        lastAttemptAt: new Date(),
        reviewed: false,
        metadata: request.metadata
      });
    } catch (dlqError) {
      console.error('Failed to move request to DLQ:', dlqError);
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(request: QueueRequest): QueueRequestResponseDto {
    return {
      requestId: request.requestId,
      status: request.status,
      mode: request.mode,
      type: request.type,
      priority: request.priority,
      createdAt: request.createdAt,
      queuePosition: undefined // Would need separate query
    };
  }

  /**
   * Cancel a pending request
   */
  async cancelRequest(requestId: string, userId: Types.ObjectId): Promise<void> {
    const request = await this.queueRequestModel.findOne({ requestId, userId });

    if (!request) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Queue request not found',
          error: 'NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    if (request.status !== REQUEST_STATUS.PENDING) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Can only cancel pending requests',
          error: 'INVALID_STATUS'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    await this.queueRequestModel.updateOne(
      { requestId },
      { status: REQUEST_STATUS.CANCELLED }
    );
  }
}
