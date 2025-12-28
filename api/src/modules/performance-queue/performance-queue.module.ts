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
import { QueueModule, AgendaModule } from 'src/kernel';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { DBLoggerModule } from '../logger/db-logger.module';

// Import schemas
import { QueueRequest, QueueRequestSchema, QueueMetrics, QueueMetricsSchema } from './schemas';

// Import services
import { PriorityQueueService, QueueMetricsService } from './services';

// Import controllers
import { PerformanceQueueController } from './controllers';

// Import listeners
import { PerformanceQueueListener } from './listeners';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: QueueRequest.name,
        schema: QueueRequestSchema
      },
      {
        name: QueueMetrics.name,
        schema: QueueMetricsSchema
      }
    ]),
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => DBLoggerModule)
  ],
  providers: [
    PriorityQueueService,
    QueueMetricsService,
    PerformanceQueueListener
  ],
  controllers: [
    PerformanceQueueController
  ],
  exports: [
    PriorityQueueService,
    QueueMetricsService
  ]
})
export class PerformanceQueueModule {}
