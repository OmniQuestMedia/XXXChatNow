# Performance Queue Module

## Overview

The Performance Queue module is the **authoritative service** for managing queue intake, ordering, and lifecycle for all interactive monetized features in XXXChatNow.

Per the [Integration Contract](../../../../../XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md), all interactive features (chip menu, slot machine, wheel, tips, etc.) must route through this queue system for proper ordering, settlement, and refunds.

## Architecture

### Core Responsibilities

1. **Queue Intake**: Accept standardized `QueueIntakePayload` from feature modules
2. **FIFO Ordering**: Maintain first-in-first-out ordering per performer
3. **Queue Depth Management**: Enforce maximum queue limits (50 items per performer)
4. **Idempotency**: Prevent duplicate processing using unique keys
5. **Mode Detection**: Handle both queue ON (standard) and OFF (pass-through) modes
6. **State Machine**: Manage lifecycle transitions (created → started → finished/abandoned/refunded)
7. **Settlement Coordination**: Mark items ready for escrow release (delegates actual wallet operations)

### Queue Modes

#### Mode ON (Standard Queue)
- Items are added to FIFO queue per performer
- Performer manually starts and finishes each item
- Position tracking and wait time estimation
- Notifications at key positions (e.g., 3rd in queue)

#### Mode OFF (Pass-Through)
- Items auto-start and auto-finish immediately
- No queuing, instant settlement ready
- Used when performer wants instant processing without queue management

## Schema

### QueueItem Collection

```typescript
{
  idempotencyKey: string;          // Unique key for deduplication
  sourceFeature: string;           // 'slot_machine', 'chip_menu', etc.
  sourceEventId: string;           // Original transaction ID
  performerId: ObjectId;           // Performer processing this item
  userId: ObjectId;                // User who initiated
  escrowTransactionId: string;     // Escrow hold reference
  tokens: number;                  // Amount in loyalty points
  title: string;                   // Display title
  description: string;             // What performer should do
  durationSeconds: number | null;  // Expected duration
  metadata: object;                // Feature-specific data
  status: QueueItemStatus;         // Lifecycle status
  position: number;                // Position in queue
  passThroughMode: boolean;        // Was this in pass-through mode?
  
  // Timestamps for audit trail
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  abandonedAt: Date | null;
  refundedAt: Date | null;
  
  // Settlement tracking
  settled: boolean;
  settledAt: Date | null;
  settlementTransactionId: string | null;
  refundReason: string | null;
}
```

## API Methods

### Core Queue Operations

#### `createQueueItem(intake, queueMode)`
Creates a new queue item from standardized intake payload.

**Parameters:**
- `intake: QueueIntakePayload` - Standardized payload from feature
- `queueMode: QueueMode` - ON (standard) or OFF (pass-through)

**Returns:** `QueueItemDocument`

**Behavior:**
- **Mode ON**: Adds to FIFO queue, enforces depth limits
- **Mode OFF**: Auto-starts and auto-finishes immediately

**Throws:**
- `QUEUE_FULL`: Queue depth exceeds 50 items
- `DUPLICATE_IDEMPOTENCY_KEY`: Key already exists

---

#### `getQueuePosition(itemId)`
Gets current position and estimated wait time for a queue item.

**Returns:**
```typescript
{
  itemId: string;
  performerId: string;
  position: number;
  totalInQueue: number;
  estimatedWaitSeconds: number | null;
  status: string;
}
```

---

#### `startItem(itemId)`
Starts processing a queue item (CREATED → STARTED).

**Requirements:**
- Item must be in CREATED status
- Performer cannot have another item in STARTED status

**Throws:**
- `INVALID_STATE_TRANSITION`: Invalid status for starting
- `ALREADY_PROCESSING`: Performer already processing another item

---

#### `completeItem(itemId)`
Completes a queue item (STARTED → FINISHED).

**Requirements:**
- Item must be in STARTED status (or pass-through mode)

**Side Effects:**
- Marks item ready for settlement (escrow → performer earnings)
- Recalculates positions for remaining items in queue

---

#### `abandonItem(itemId, reason?)`
Marks item as abandoned (disconnection, timeout, etc.).

**Requirements:**
- Item must be in CREATED or STARTED status

**Side Effects:**
- Item marked for refund
- Positions recalculated for remaining items

---

#### `refundItem(itemId, reason)`
Refunds a queue item (escrow → user).

**Parameters:**
- `itemId: string`
- `reason: RefundReason` - Standardized refund reason

**Requirements:**
- Item must not be already refunded or settled

**Throws:**
- `INVALID_STATE_TRANSITION`: Already refunded or settled

---

### Helper Methods

#### `getQueueDepth(performerId)`
Returns current queue depth for a performer.

#### `getPerformerQueue(performerId)`
Returns all active queue items for a performer (sorted by position).

#### `getUserQueueHistory(userId, limit?, skip?)`
Returns queue history for a user (paginated).

## Usage Examples

### Feature Integration (e.g., Slot Machine)

```typescript
import { PerformanceQueueService, QueueIntakePayload, QueueMode } from '../performance-queue';

// 1. Feature creates escrow hold (not shown)
const escrowTxId = await escrowService.createHold(userId, betAmount, idempotencyKey);

// 2. Feature emits standardized queue intake
const intake: QueueIntakePayload = {
  idempotencyKey: `slot_machine_${spinId}_${Date.now()}`,
  sourceFeature: 'slot_machine',
  sourceEventId: spinId,
  performerId: performerId,
  userId: userId,
  escrowTransactionId: escrowTxId,
  tokens: betAmount,
  title: 'Slot Machine Spin',
  description: 'Process slot machine spin result',
  durationSeconds: null,
  metadata: { symbols: ['cherry', 'lemon', 'bar'], payout: 100 }
};

// 3. Queue processes the item
const queueItem = await performanceQueueService.createQueueItem(intake, QueueMode.OFF);

// 4. In pass-through mode, item is immediately ready for settlement
// Queue will coordinate with wallet service for escrow release
```

### Performer Queue Management

```typescript
// Get performer's current queue
const queue = await performanceQueueService.getPerformerQueue(performerId);

// Start next item
const nextItem = queue[0];
await performanceQueueService.startItem(nextItem._id);

// Complete item
await performanceQueueService.completeItem(nextItem._id);

// Or abandon if performer disconnects
await performanceQueueService.abandonItem(nextItem._id, 'Performer disconnected');
```

### User Queue Status

```typescript
// Get position in queue
const position = await performanceQueueService.getQueuePosition(itemId);

console.log(`You are #${position.position} in queue`);
console.log(`Estimated wait: ${position.estimatedWaitSeconds} seconds`);

// Get user's queue history
const history = await performanceQueueService.getUserQueueHistory(userId, 10);
```

## State Machine

```
                    createQueueItem()
                           |
                           v
    ┌─────────────────[CREATED]─────────────────┐
    |                     |                      |
    |                     | startItem()          |
    |                     v                      |
    |                [STARTED]                   |
    |                     |                      |
    |      ┌─────────────┼─────────────┐        |
    |      |              |             |        |
    |      | completeItem | abandonItem |        |
    |      v              v             v        |
    | [FINISHED]    [ABANDONED]         |        |
    |      |              |             |        |
    |      |              └─────────────┼────────┘
    |      |                            |
    |      |        refundItem()        |
    |      |                            |
    └──────┴───────────────────────────┴──────> [REFUNDED]
```

## Integration Checklist

When integrating a new feature with the performance queue:

- [ ] Feature creates escrow hold before emitting queue intake
- [ ] Feature emits complete `QueueIntakePayload` with all required fields
- [ ] Feature uses proper idempotency key format: `{feature}_{eventId}_{timestamp}`
- [ ] Feature does NOT implement its own settlement logic
- [ ] Feature does NOT implement its own refund logic
- [ ] Feature does NOT manipulate queue ordering
- [ ] Feature uses template-based messaging (not literal strings)
- [ ] Feature handles queue mode (ON vs OFF) appropriately
- [ ] Tests cover idempotency, queue depth limits, and state transitions

## Security Considerations

1. **Idempotency**: All operations use idempotency keys to prevent duplicates
2. **Audit Trail**: Complete timestamp history for all state transitions
3. **No PII**: User/performer IDs are references only, no sensitive data in logs
4. **Server-Side Only**: All queue operations happen server-side
5. **Authorization**: Controllers (when added) must verify user/performer ownership
6. **Rate Limiting**: Queue depth limits prevent abuse

## Future Enhancements

The following features are planned but not yet implemented:

1. **Escrow Integration**: Actual wallet service integration for holds/releases/refunds
2. **Event Emission**: Integration with `QueueEventService` for real-time notifications
3. **Rope Drop Timing**: Automatic timeouts and cleanup for stale items
4. **Circuit Breaker**: Fault tolerance for wallet service calls
5. **Analytics**: Queue metrics and performance tracking
6. **WebSocket**: Real-time queue position updates to users
7. **Admin Controls**: Queue management endpoints for administrators

## Testing

### Unit Tests

```bash
cd api
yarn test performance-queue.service.spec.ts
```

### Integration Tests

```bash
yarn test:e2e performance-queue.e2e.spec.ts
```

## References

- [Integration Contract](../../../../../XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md)
- [Current Status](../../../../../CURRENT_STATUS_AND_NEXT_STEPS.md)
- [Security Policy](../../../../../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [Performance Queue Architecture](../../../../../PERFORMANCE_QUEUE_ARCHITECTURE.md)

## Maintainers

See [CONTRIBUTING.md](../../../../../CONTRIBUTING.md) for contact information.

---

**Last Updated**: December 28, 2025  
**Status**: Step 2 Complete - Core Queue Service Implemented  
**Next Steps**: Phase 2 - Escrow & Wallet Integration
