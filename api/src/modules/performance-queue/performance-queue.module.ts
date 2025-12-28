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

// Import schemas when implemented
// import { QueueRequest, QueueRequestSchema } from './schemas';

// Import services when implemented
// import { PerformanceQueueService } from './services';

// Import controllers when implemented
// import { PerformanceQueueController } from './controllers';

// Import listeners when implemented
// import { PerformanceQueueListener } from './listeners';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   {
    //     name: QueueRequest.name,
    //     schema: QueueRequestSchema
    //   }
    // ]),
    QueueModule.forRoot(),
    AgendaModule.register(),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => DBLoggerModule)
  ],
  providers: [
    // Services will be added here as they are implemented
    // PerformanceQueueService,
    // PerformanceQueueListener
  ],
  controllers: [
    // Controllers will be added here as they are implemented
    // PerformanceQueueController
  ],
  exports: [
    // Export services that need to be used by other modules
    // PerformanceQueueService
  ]
})
export class PerformanceQueueModule {}
