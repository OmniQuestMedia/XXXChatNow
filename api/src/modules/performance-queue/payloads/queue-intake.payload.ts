/**
 * Queue Intake Payload
 * 
 * Standardized payload for queue item creation from any interactive feature.
 * This interface defines the contract between feature modules and the performance queue.
 * 
 * References:
 * - XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md (Section 8)
 * 
 * IMPORTANT: Feature modules MUST provide all required fields.
 * The queue service is the sole authority for processing these items.
 */

/**
 * Standardized queue intake payload
 * All interactive features must emit this structure when adding items to the queue
 */
export interface QueueIntakePayload {
  /**
   * Unique idempotency key to prevent duplicate processing
   * Format: {sourceFeature}_{sourceEventId}_{timestamp}
   */
  idempotencyKey: string;

  /**
   * Source feature identifier
   * Examples: 'chip_menu', 'slot_machine', 'wheel', 'tip_menu'
   */
  sourceFeature: string;

  /**
   * Source event/transaction ID from the originating feature
   * Examples: spinId, purchaseId, transactionId
   */
  sourceEventId: string;

  /**
   * Performer/model ID who will process this queue item
   */
  performerId: string;

  /**
   * User ID who initiated the request
   */
  userId: string;

  /**
   * Escrow transaction ID that holds the funds
   * The queue will release or refund this escrow based on item lifecycle
   */
  escrowTransactionId: string;

  /**
   * Token/points amount for this queue item
   */
  tokens: number;

  /**
   * Title/name of the queue item
   * Example: "Wheel Spin Result", "Tip Menu Item: Dance"
   */
  title: string;

  /**
   * Description of what the performer should do
   * Example: "Perform dance for 2 minutes"
   */
  description: string;

  /**
   * Expected duration in seconds (null if not applicable)
   * Used for queue time estimation and timeout handling
   */
  durationSeconds: number | null;

  /**
   * Additional metadata (non-PII)
   * Can include feature-specific data needed for processing
   * Example: { wheelPosition: 5, itemCategory: 'dance' }
   */
  metadata?: Record<string, any>;
}

/**
 * Create Queue Item DTO
 * Used for API endpoint validation
 */
export class CreateQueueItemDto implements QueueIntakePayload {
  idempotencyKey: string;
  sourceFeature: string;
  sourceEventId: string;
  performerId: string;
  userId: string;
  escrowTransactionId: string;
  tokens: number;
  title: string;
  description: string;
  durationSeconds: number | null;
  metadata?: Record<string, any>;
}

/**
 * Update Queue Item DTO
 * Used for admin/performer updates to queue items
 */
export interface UpdateQueueItemDto {
  title?: string;
  description?: string;
  durationSeconds?: number | null;
  metadata?: Record<string, any>;
}

/**
 * Queue Position Response
 * Returned when querying item position
 */
export interface QueuePositionResponse {
  itemId: string;
  performerId: string;
  position: number;
  totalInQueue: number;
  estimatedWaitSeconds: number | null;
  status: string;
}

/**
 * Refund Reason
 * Standardized reasons for refunding queue items
 */
export enum RefundReason {
  PERFORMER_DISCONNECTED = 'performer_disconnected',
  PERFORMER_DECLINED = 'performer_declined',
  USER_CANCELLED = 'user_cancelled',
  TIMEOUT = 'timeout',
  TECHNICAL_ERROR = 'technical_error',
  ADMIN_REFUND = 'admin_refund'
}
