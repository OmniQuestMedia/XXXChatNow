/**
 * Performance Queue Event Listener
 * 
 * Listens to queue events and performs actions like notifications,
 * logging, and triggering downstream processes.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 */

import { Injectable, Logger } from '@nestjs/common';
import { QueueEventListener, QueueEvent } from 'src/kernel';
import { PERFORMANCE_QUEUE_CHANNEL, PERFORMANCE_QUEUE_EVENT } from '../constants';

@Injectable()
export class PerformanceQueueListener {
  private readonly logger = new Logger(PerformanceQueueListener.name);

  constructor() {
    // Event listener initialization happens via decorators
  }

  /**
   * Initialize event listeners
   */
  @QueueEventListener({
    eventName: PERFORMANCE_QUEUE_CHANNEL,
    name: 'handle-request-submitted'
  })
  async handleRequestSubmitted(event: QueueEvent): Promise<void> {
    if (event.eventName === PERFORMANCE_QUEUE_EVENT.REQUEST_SUBMITTED) {
      this.logger.log(`Request submitted: ${event.data.requestId}`);
      
      // Extension points for future enhancements:
      // - Send real-time notification to user via WebSocket
      // - Update dashboard metrics in real-time
      // - Trigger analytics tracking
    }
  }

  @QueueEventListener({
    eventName: PERFORMANCE_QUEUE_CHANNEL,
    name: 'handle-request-completed'
  })
  async handleRequestCompleted(event: QueueEvent): Promise<void> {
    if (event.eventName === PERFORMANCE_QUEUE_EVENT.REQUEST_COMPLETED) {
      this.logger.log(`Request completed: ${event.data.requestId}`);
      
      // Extension points for future enhancements:
      // - Send completion notification to user
      // - Trigger downstream processes
      // - Update analytics
    }
  }

  @QueueEventListener({
    eventName: PERFORMANCE_QUEUE_CHANNEL,
    name: 'handle-request-failed'
  })
  async handleRequestFailed(event: QueueEvent): Promise<void> {
    if (event.eventName === PERFORMANCE_QUEUE_EVENT.REQUEST_FAILED) {
      this.logger.error(`Request failed: ${event.data.requestId}`, event.data.error);
      
      // Extension points for future enhancements:
      // - Send failure notification to user
      // - Alert monitoring system (e.g., Sentry, DataDog)
      // - Move to dead letter queue if max retries exceeded
      // - Create incident ticket for operations team
    }
  }

  @QueueEventListener({
    eventName: PERFORMANCE_QUEUE_CHANNEL,
    name: 'handle-queue-full'
  })
  async handleQueueFull(event: QueueEvent): Promise<void> {
    if (event.eventName === PERFORMANCE_QUEUE_EVENT.QUEUE_FULL) {
      this.logger.warn('Queue is full, rejecting new requests');
      
      // Extension points for future enhancements:
      // - Alert operations team via PagerDuty/OpsGenie
      // - Trigger auto-scaling in cloud environment
      // - Activate circuit breaker to protect system
      // - Send notification to administrators
    }
  }
}
