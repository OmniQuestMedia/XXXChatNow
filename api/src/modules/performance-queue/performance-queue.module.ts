/**
 * Performance Queue Module
 * 
 * Core module for managing performance queue architecture including FIFO, Priority, and Batch processing modes.
 * Ensures scalability, efficiency, and reliability across the platform for interactive features.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - CONTRIBUTING.md
 * - COPILOT_GOVERNANCE.md
 */

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { QueueModule, AgendaModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { DBLoggerModule } from '../logger/db-logger.module';
import { QueueRequest, QueueRequestSchema, DeadLetterQueue, DeadLetterQueueSchema } from './schemas';
import { PerformanceQueueService, QueueRateLimitService, QueueHealthService } from './services';
import { PerformanceQueueController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: QueueRequest.name,
        schema: QueueRequestSchema
      },
      {
        name: DeadLetterQueue.name,
        schema: DeadLetterQueueSchema
      }
    ]),
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => DBLoggerModule)
  ],
  providers: [
    PerformanceQueueService,
    QueueRateLimitService,
    QueueHealthService
  ],
  controllers: [
    PerformanceQueueController
  ],
  exports: [
    PerformanceQueueService,
    QueueRateLimitService,
    QueueHealthService
  ]
})
export class PerformanceQueueModule {}
