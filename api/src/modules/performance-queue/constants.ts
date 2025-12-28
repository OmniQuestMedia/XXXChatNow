/**
 * Performance Queue Constants
 * 
 * Defines constants for queue states, modes, limits, and error codes.
 * 
 * References:
 * - XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md
 * - CURRENT_STATUS_AND_NEXT_STEPS.md (Section 3 - Performance Queue)
 */

/**
 * Queue item status states
 * Represents the lifecycle of a queue item
 */
export enum QueueItemStatus {
  CREATED = 'created',       // Initial state when item is added to queue
  STARTED = 'started',       // Performer has started processing the item
  FINISHED = 'finished',     // Item completed successfully, ready for settlement
  ABANDONED = 'abandoned',   // Item abandoned due to disconnection or timeout
  REFUNDED = 'refunded'      // Item refunded (can happen from any state)
}

/**
 * Queue modes for performers
 * Determines how queue items are processed
 */
export enum QueueMode {
  ON = 'on',   // Standard FIFO queue - performer manually starts/finishes items
  OFF = 'off'  // Pass-through mode - auto-start and auto-finish immediately
}

/**
 * Queue limits and constraints
 */
export const QUEUE_LIMITS = {
  MAX_QUEUE_DEPTH: 50,        // Maximum items per performer queue
  DEFAULT_DURATION: 60,        // Default duration in seconds if not specified
  MAX_DURATION: 3600,          // Maximum allowed duration (1 hour)
  POSITION_RECALC_BATCH: 100   // Batch size for position recalculation
};

/**
 * Queue events for messaging and notifications
 */
export const QUEUE_EVENTS = {
  ITEM_CREATED: 'queue.item.created',
  ITEM_STARTED: 'queue.item.started',
  ITEM_FINISHED: 'queue.item.finished',
  ITEM_ABANDONED: 'queue.item.abandoned',
  ITEM_REFUNDED: 'queue.item.refunded',
  POSITION_UPDATED: 'queue.position.updated',
  THIRD_POSITION_NOTICE: 'queue.item.third_position_notice'
};

/**
 * Error codes for queue operations
 */
export const QUEUE_ERRORS = {
  QUEUE_FULL: 'QUEUE_FULL',
  DUPLICATE_IDEMPOTENCY_KEY: 'DUPLICATE_IDEMPOTENCY_KEY',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  PERFORMER_NOT_FOUND: 'PERFORMER_NOT_FOUND',
  INVALID_MODE: 'INVALID_MODE',
  ESCROW_NOT_FOUND: 'ESCROW_NOT_FOUND',
  ALREADY_PROCESSING: 'ALREADY_PROCESSING'
};

/**
 * Queue channels for event emission
 */
export const QUEUE_CHANNEL = {
  QUEUE_UPDATES: 'queue.updates',
  QUEUE_NOTIFICATIONS: 'queue.notifications'
};
