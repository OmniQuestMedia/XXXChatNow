/**
 * Performance Queue Module Constants
 * 
 * Defines queue limits, timeout values, and configuration for the performance queue system.
 * 
 * References:
 * - PERFORMANCE_QUEUE_ARCHITECTURE.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 * - COPILOT_GOVERNANCE.md
 */

export const PERFORMANCE_QUEUE_CHANNEL = 'PERFORMANCE_QUEUE_CHANNEL';

/**
 * Queue Events
 */
export const PERFORMANCE_QUEUE_EVENT = {
  REQUEST_SUBMITTED: 'request.submitted',
  REQUEST_ASSIGNED: 'request.assigned',
  REQUEST_PROCESSING: 'request.processing',
  REQUEST_COMPLETED: 'request.completed',
  REQUEST_FAILED: 'request.failed',
  REQUEST_TIMEOUT: 'request.timeout',
  QUEUE_FULL: 'queue.full',
  QUEUE_EMPTY: 'queue.empty'
};

/**
 * Queue Modes
 */
export const QUEUE_MODE = {
  FIFO: 'fifo',
  PRIORITY: 'priority',
  BATCH: 'batch'
};

/**
 * Request Status
 */
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled'
};

/**
 * Priority Levels (for priority queue mode)
 */
export const PRIORITY_LEVEL = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 20
};

/**
 * Queue Configuration Defaults
 */

// Maximum number of requests in queue before rejecting new ones
export const MAX_QUEUE_DEPTH = 10000;

// Maximum time a request can wait in queue before timing out (in milliseconds)
export const QUEUE_TIMEOUT_MS = 30000; // 30 seconds

// Maximum time for processing a request before timing out (in milliseconds)
export const PROCESSING_TIMEOUT_MS = 60000; // 60 seconds

// Rope drop timeout - maximum wait time for initial queue entry (in milliseconds)
export const ROPE_DROP_TIMEOUT_MS = 5000; // 5 seconds

// Batch processing configuration
export const BATCH_SIZE = 100; // Number of requests to process in a batch
export const BATCH_INTERVAL_MS = 1000; // How often to process batches (in milliseconds)

// Worker configuration
export const MAX_CONCURRENT_WORKERS = 10; // Maximum number of concurrent processing workers
export const WORKER_IDLE_TIMEOUT_MS = 30000; // Time before idle worker shuts down

// Retry configuration
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 1000; // Initial backoff time for retries

// Rate limiting
export const MAX_REQUESTS_PER_USER_PER_MINUTE = 60;

/**
 * Error Codes
 */
export const PERFORMANCE_QUEUE_ERRORS = {
  QUEUE_FULL: 'QUEUE_FULL',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  WORKER_UNAVAILABLE: 'WORKER_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  INVALID_PRIORITY: 'INVALID_PRIORITY',
  INVALID_MODE: 'INVALID_MODE'
};

/**
 * API Constants
 */
// Maximum time period for metrics queries (in minutes)
export const MAX_METRICS_PERIOD_MINUTES = 1440; // 24 hours

// Maximum number of DLQ entries to return per request
export const MAX_DLQ_LIMIT = 100;

// Default DLQ limit if not specified
export const DEFAULT_DLQ_LIMIT = 50;
