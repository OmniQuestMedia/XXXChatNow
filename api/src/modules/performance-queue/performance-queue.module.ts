/**
 * Performance Queue Module
 * 
 * Main module for performance queue functionality.
 * Handles queue management, FIFO ordering, and lifecycle state management.
 * 
 * This module is the authoritative service for:
 * - Queue intake from all interactive features
 * - Queue ordering and depth management
 * - State transitions (created -> started -> finished/abandoned/refunded)
 * - Settlement and refund coordination (delegates to wallet/escrow services)
 * 
 * References:
 * - XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md
 * - CURRENT_STATUS_AND_NEXT_STEPS.md (Section 3)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueItem, QueueItemSchema } from './schemas';
import { PerformanceQueueService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: QueueItem.name,
        schema: QueueItemSchema
      }
    ])
  ],
  providers: [
    PerformanceQueueService
  ],
  exports: [
    PerformanceQueueService
  ]
})
export class PerformanceQueueModule {}
