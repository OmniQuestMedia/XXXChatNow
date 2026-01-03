# Lovense Canonical Payload and Routing Specification

**Version:** 1.0  
**Date:** 2026-01-03  
**Status:** Draft

## Purpose

This document defines the canonical event payload structure and routing for Lovense toy integration events within the XXXChatNow platform. It ensures consistent event emission, persistence, and processing across all interactive features.

---

## Event Types

### TipActivated Event

The `TipActivated` event is emitted when a tip transaction has been fully settled and is ready to trigger Lovense toy activation (if configured).

#### Event Name
```
TipActivated
```

#### Trigger Conditions
- Transaction `type` must be `PURCHASE_ITEM_TYPE.TIP`
- Transaction `status` must be `PURCHASE_ITEM_STATUS.SUCCESS`
- Transaction `settlementStatus` must be `SETTLED`
- Event must be emitted exactly once per tip (idempotency enforced)

#### Payload Structure

```typescript
{
  // Idempotency & Identity
  tipId: string;              // Unique identifier for this tip (from purchasedItem._id)
  idempotencyKey: string;     // Same as tipId to enforce once-only emission
  
  // Event Metadata
  eventType: 'TipActivated';
  eventTimestamp: Date;       // When the event was emitted
  
  // Financial Details
  totalPrice: number;         // Total tokens tipped
  netPrice: number;           // Net amount after commissions
  commission: number;         // Commission percentage applied
  studioCommission: number;   // Studio commission percentage (if applicable)
  
  // Participants
  tipper: {
    userId: ObjectId;         // User who sent the tip
    username: string;         // Tipper username
    role: string;             // 'user' or 'performer'
  };
  
  recipient: {
    performerId: ObjectId;    // Performer receiving the tip
    username: string;         // Performer username
    studioId?: ObjectId;      // Studio ID if performer is studio-affiliated
  };
  
  // Ledger References (Audit Trail)
  ledger: {
    transactionId: ObjectId;  // Reference to purchased_item document
    conversationId?: ObjectId; // Conversation where tip occurred (if applicable)
    sourceBalance: {
      before: number;         // Tipper balance before transaction
      after: number;          // Tipper balance after transaction
      change: number;         // Amount deducted (negative value)
    };
    recipientBalance: {
      before: number;         // Performer balance before transaction
      after: number;          // Performer balance after transaction
      change: number;         // Amount added (positive value)
    };
  };
  
  // Settlement Details
  settlement: {
    status: 'SETTLED';        // Must be SETTLED for TipActivated
    settledAt: Date;          // When the settlement was finalized
    settlementId?: string;    // Optional settlement batch ID
  };
  
  // Context & Metadata
  context: {
    conversationType?: string; // 'private', 'group', 'performer_community', etc.
    streamType?: string;      // 'private', 'group', 'public' if during stream
    customMessage?: string;   // Optional tip message
  };
  
  // Processing Status
  processed: boolean;         // Whether event has been processed
  processedAt?: Date;        // When event was processed
  processingError?: string;  // Error message if processing failed
}
```

#### Required Fields (Minimum Viable Event)
- `tipId`
- `idempotencyKey`
- `eventType`
- `eventTimestamp`
- `totalPrice`
- `tipper.userId`
- `recipient.performerId`
- `ledger.transactionId`
- `settlement.status`
- `settlement.settledAt`

#### Optional Fields
- `netPrice` (calculated if commissions exist)
- `commission`
- `studioCommission`
- `tipper.username`
- `recipient.username`
- `recipient.studioId`
- `ledger.conversationId`
- `ledger.sourceBalance.*` (if balance tracking is available)
- `ledger.recipientBalance.*` (if balance tracking is available)
- `settlement.settlementId`
- `context.*`
- `processed`
- `processedAt`
- `processingError`

---

## Persistence

### Storage Location
TipActivated events MUST be persisted to the performance queue system for reliable processing.

### Schema
Events are stored in the `queue_requests` collection with:
- `type`: `'TipActivated'`
- `mode`: `'fifo'` (First-In-First-Out processing)
- `payload`: Full TipActivated event payload
- `idempotencyKey`: Set to `tipId` to prevent duplicates
- `status`: `'pending'` initially
- `priority`: `10` (medium-high priority)

### Idempotency
The `idempotencyKey` field in `queue_requests` ensures that duplicate events are rejected:
- Database unique index on `idempotencyKey` prevents duplicate inserts
- Duplicate submission attempts return the existing event without error
- This guarantees exactly-once emission semantics

---

## Settlement Status

### Settlement Lifecycle
```
pending → processing → settled
         ↓
      cancelled/failed
```

#### Status Definitions
- `pending`: Transaction authorized but not yet settled
- `processing`: Settlement in progress
- `settled`: Funds transferred, transaction complete (FINAL STATE)
- `cancelled`: Transaction cancelled before settlement
- `failed`: Settlement failed, transaction rolled back

### Settlement Status Field
Add to `PurchasedItem` schema:
```typescript
settlementStatus: {
  type: String,
  enum: ['pending', 'processing', 'settled', 'cancelled', 'failed'],
  default: 'pending',
  index: true
}
```

For the initial implementation:
- Transactions with `status: 'success'` can be treated as `settlementStatus: 'settled'`
- Future enhancements can add separate settlement processing

---

## Event Emission Rules

### When to Emit
1. Transaction must have `type === 'tip'`
2. Transaction must have `status === 'success'`
3. Transaction must have `settlementStatus === 'settled'`
4. Event must NOT have been emitted previously for this `tipId`

### Where to Emit
Events are emitted in `api/src/modules/purchased-item/listeners/payment-token.listener.ts`:
- After balance updates complete
- Before socket notifications
- Within the existing transaction handler

### Error Handling
- If event emission fails, log error but do NOT block the transaction
- Failed emissions can be retried via admin tools
- Dead Letter Queue (DLQ) captures permanently failed events

---

## Routing (Future)

### Event Consumers
1. **Lovense Activation Service** (future implementation)
   - Subscribes to TipActivated events
   - Determines if toy activation is configured
   - Dispatches toy commands via Lovense SDK
   
2. **Analytics Service** (future implementation)
   - Tracks tip patterns
   - Generates revenue reports
   
3. **Notification Service** (current implementation)
   - Already handles tip notifications
   - Can be enhanced to consume TipActivated events

### Event Flow (Future)
```
TipActivated Event
    ↓
Queue Request (persisted)
    ↓
Event Dispatcher
    ↓
    ├─→ Lovense Activation Service
    ├─→ Analytics Service
    └─→ Notification Service
```

---

## Security & Compliance

### Audit Requirements
- All TipActivated events MUST include complete ledger references
- Events MUST be immutable once created
- Event timestamps MUST be accurate (server-side only)
- Sensitive data (balances) should be logged securely

### Data Retention
- Events retained for 90 days in active queue
- After 90 days, archived to long-term storage
- Audit queries must access archived events when needed

### Privacy Considerations
- Do NOT include sensitive personal information beyond IDs
- Usernames are acceptable for operational purposes
- Balance information is for audit trail only

---

## Validation Rules

### Pre-Emission Checks
1. Verify transaction exists and is valid
2. Confirm settlement status is SETTLED
3. Check idempotency (has event been emitted before?)
4. Validate all required fields are present
5. Ensure numeric fields are non-negative

### Post-Emission Verification
1. Confirm event persisted to queue
2. Log event emission for audit trail
3. Update transaction metadata (mark as event-emitted)

---

## Examples

### Minimal TipActivated Event
```json
{
  "tipId": "507f1f77bcf86cd799439011",
  "idempotencyKey": "507f1f77bcf86cd799439011",
  "eventType": "TipActivated",
  "eventTimestamp": "2026-01-03T04:15:00.000Z",
  "totalPrice": 100,
  "tipper": {
    "userId": "507f191e810c19729de860ea"
  },
  "recipient": {
    "performerId": "507f191e810c19729de860eb"
  },
  "ledger": {
    "transactionId": "507f1f77bcf86cd799439011"
  },
  "settlement": {
    "status": "SETTLED",
    "settledAt": "2026-01-03T04:15:00.000Z"
  }
}
```

### Complete TipActivated Event
```json
{
  "tipId": "507f1f77bcf86cd799439011",
  "idempotencyKey": "507f1f77bcf86cd799439011",
  "eventType": "TipActivated",
  "eventTimestamp": "2026-01-03T04:15:00.000Z",
  "totalPrice": 100,
  "netPrice": 75,
  "commission": 25,
  "studioCommission": 10,
  "tipper": {
    "userId": "507f191e810c19729de860ea",
    "username": "user123",
    "role": "user"
  },
  "recipient": {
    "performerId": "507f191e810c19729de860eb",
    "username": "performer456",
    "studioId": "507f191e810c19729de860ec"
  },
  "ledger": {
    "transactionId": "507f1f77bcf86cd799439011",
    "conversationId": "507f191e810c19729de860ed",
    "sourceBalance": {
      "before": 500,
      "after": 400,
      "change": -100
    },
    "recipientBalance": {
      "before": 1000,
      "after": 1075,
      "change": 75
    }
  },
  "settlement": {
    "status": "SETTLED",
    "settledAt": "2026-01-03T04:15:00.000Z",
    "settlementId": "batch_20260103_001"
  },
  "context": {
    "conversationType": "private",
    "streamType": "private",
    "customMessage": "Great performance!"
  },
  "processed": false
}
```

---

## Migration Path

### Phase 1: Event Emission (Current PR)
- ✅ Create specification document
- ✅ Add settlementStatus to schema (or use existing status)
- ✅ Implement TipActivated event emission
- ✅ Persist events to performance queue
- ✅ Enforce idempotency
- ❌ NO toy activation yet

### Phase 2: Event Processing (Future PR)
- Create Lovense Activation Service
- Subscribe to TipActivated events
- Implement toy command dispatch
- Add configuration for per-tip activation rules

### Phase 3: Advanced Features (Future)
- Menu-driven activation patterns
- Custom vibration sequences
- Activation analytics
- Admin monitoring dashboard

---

## References

- **Performance Queue Architecture**: `/PERFORMANCE_QUEUE_ARCHITECTURE.md`
- **Lovense Integration Evaluation**: `/LOVENSE_INTEGRATION_EVALUATION.md`
- **Security Policy**: `/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- **Copilot Governance**: `/COPILOT_GOVERNANCE.md`

---

**Document Status**: Approved for implementation  
**Next Review**: After Phase 1 implementation complete
