# Lovense Canonical Payload and Routing Specification

**Version:** 1.0  
**Date:** 2026-01-03  
**Status:** Active

## Purpose

This document defines the canonical event payload structure and routing for Lovense toy integration events within the XXXChatNow platform. It ensures consistent event emission, persistence, and processing across all interactive features, with integration to the RedRoomRewards (RRR) loyalty system.

---

## Event Types

### TipActivated Event

The `TipActivated` event is emitted when a tip transaction has been fully settled and is ready to trigger Lovense toy activation (if configured).

#### Event Name
```
TipActivated
```

#### Channel
```
TIP_ACTIVATED_CHANNEL
```

#### Trigger Conditions
- Transaction `type` must be `PURCHASE_ITEM_TYPE.TIP`
- Transaction `status` must be `PURCHASE_ITEM_STATUS.SUCCESS`
- RRR ledger entry must have `posted_at != null` (indicating SETTLED state)
- Event must be emitted exactly once per tip (idempotency enforced)

**Note:** RRR (RedRoomRewards) has no explicit "status" field in ledger entries. The settlement status is derived from the `posted_at` field:
- **SETTLED:** `posted_at != null` - The entry has been finalized and points have been awarded
- **PENDING:** `posted_at == null` - The entry exists but has not been settled yet

#### Payload Structure

```typescript
{
  // Idempotency & Identity
  tipId: string;              // Unique identifier for this tip (PurchasedItem._id as string, NOT a new UUID)
  eventId: string;            // Unique UUID for this event emission (for tracing)
  eventType: 'TipActivated';
  eventTimestamp: string;     // ISO 8601 timestamp when event was emitted
  
  // Transaction participants
  tipper: {
    userId: string;           // User who sent the tip (ObjectId as string)
    username?: string;        // Tipper username (optional)
    role?: string;            // 'user' or 'performer' (optional)
  };
  
  recipient: {
    performerId: string;      // Performer receiving the tip (ObjectId as string)
    username?: string;        // Performer username (optional)
    studioId?: string;        // Studio ID if performer is studio-affiliated (optional)
  };
  
  // Financial Details
  amount: number;             // Total tip amount in platform tokens
  netPrice?: number;          // Net amount after commissions (optional)
  commission?: number;        // Commission percentage applied (optional)
  studioCommission?: number;  // Studio commission percentage (optional)
  
  // Ledger References (RRR Integration)
  ledger: {
    transactionId: string;    // Reference to PurchasedItem._id
    conversationId?: string;  // Conversation where tip occurred (ObjectId as string, optional)
    
    // RRR-specific fields (required for RRR integration)
    sourceRef: string;        // REQUIRED - Deterministic reference: 'purchasedItem:{_id}'
    entryId: string;          // REQUIRED - RRR ledger entry ID
    postedAt: string;         // REQUIRED - ISO 8601 timestamp when RRR posted (settled) the entry
    
    // Balance tracking (optional, if available)
    sourceBalance?: {
      before?: number;        // Tipper balance before transaction
      after?: number;         // Tipper balance after transaction
      change?: number;        // Amount deducted (negative value)
    };
    recipientBalance?: {
      before?: number;        // Performer balance before transaction
      after?: number;         // Performer balance after transaction
      change?: number;        // Amount added (positive value)
    };
  };
  
  // Context & Metadata (optional)
  context?: {
    conversationType?: string; // 'private', 'group', 'performer_community', etc.
    streamType?: string;       // 'private', 'group', 'public' if during stream
    customMessage?: string;    // Optional tip message
  };
  
  // Creation timestamp
  createdAt: string;          // ISO 8601 timestamp of tip creation
  
  // Processing Status (optional, for future use)
  processed?: boolean;        // Whether event has been processed
  processedAt?: string;       // When event was processed (ISO 8601)
  processingError?: string;   // Error message if processing failed
}
```

#### Required Fields (Minimum Viable Event)
- `tipId`
- `eventId`
- `eventType`
- `eventTimestamp`
- `amount`
- `tipper.userId`
- `recipient.performerId`
- `ledger.transactionId`
- `ledger.sourceRef`
- `ledger.entryId`
- `ledger.postedAt`
- `createdAt`

#### Optional Fields
All other fields are optional and can be included as available.

#### Source Reference Format

The `ledger.sourceRef` field follows a deterministic format:

```
purchasedItem:{PurchasedItem._id}
```

Example:
```
purchasedItem:507f1f77bcf86cd799439011
```

This deterministic format ensures:
- **Idempotency:** Multiple RRR API calls with the same sourceRef are deduplicated by RRR
- **Reconciliation:** Easy mapping between XXXChatNow purchases and RRR ledger entries
- **Auditability:** Clear traceability from RRR ledger back to source transactions

---

## Database Schemas

### PurchasedItem Schema Updates

The `PurchasedItem` collection includes RRR tracking fields:

```typescript
{
  // ... existing fields ...
  
  // RRR ledger tracking (added)
  rrrLedgerEntryId: string;    // RRR ledger entry ID
  rrrSourceRef: string;        // Deterministic sourceRef used in RRR call
  rrrPostedAt: Date;           // When RRR posted the entry (null if pending)
}
```

### TipActivatedEventLog Schema

Collection: `tip_activated_event_logs`

Purpose: Ensures idempotent event emission by preventing duplicate TipActivated events for the same tip.

```typescript
{
  tipId: string;        // Unique index - string form of PurchasedItem._id
  eventId: string;      // UUID of the emitted event
  sourceRef: string;    // Index - RRR sourceRef for reconciliation
  createdAt: Date;      // Timestamp of event emission
}
```

**Indexes:**
- Unique index on `tipId` (prevents duplicate emissions)
- Regular index on `sourceRef` (supports reconciliation queries)

### Settlement Status Field (Future Enhancement)

For future implementations, a separate `settlementStatus` field can be added to `PurchasedItem`:

```typescript
settlementStatus: {
  type: String,
  enum: ['pending', 'processing', 'settled', 'cancelled', 'failed'],
  default: 'pending',
  index: true
}
```

**Current Implementation:**
- RRR integration uses `posted_at != null` to determine SETTLED status
- Transactions with `status: 'success'` AND `rrrPostedAt != null` are considered settled

---

## Event Flow

### Tip Purchase to TipActivated Event

```
1. User sends tip
   ↓
2. PurchasedItem created with status='success'
   ↓
3. PURCHASED_ITEM_SUCCESS_CHANNEL event emitted
   ↓
4. PostTipRRREarnAndEmitListener receives event
   ↓
5. Call RRR API to post earn event
   - sourceRef: 'purchasedItem:{_id}'
   - idempotencyKey: 'earn_tip_{_id}'
   ↓
6. RRR returns ledger entry info
   - entry_id
   - posted_at (may be null if pending)
   ↓
7. Update PurchasedItem with RRR fields
   - rrrLedgerEntryId
   - rrrSourceRef
   - rrrPostedAt
   ↓
8. IF posted_at != null (SETTLED):
   a. Check tip_activated_event_logs for duplicate
   b. Insert event log record (unique index enforced)
   c. Emit TipActivated event on TIP_ACTIVATED_CHANNEL
   ELSE:
   Skip event emission (not yet settled)
```

### Idempotency Guarantees

**Multiple Levels of Idempotency:**

1. **RRR Level:** Idempotency-Key header prevents duplicate earn events at RRR API
2. **Database Level:** Unique index on `tip_activated_event_logs.tipId` prevents duplicate event records
3. **Application Level:** Check for existing event log before emission

**Concurrent Emission Protection:**

If multiple processes attempt to emit TipActivated for the same tip concurrently:
- First process succeeds in inserting event log record
- Subsequent processes fail with duplicate key error (code 11000)
- Application treats duplicate key error as no-op
- Result: Exactly one TipActivated event is emitted

---

## Persistence

### Storage Location
TipActivated events are emitted via the queue event system and can be:
- Consumed immediately by listeners
- Persisted to the performance queue system for reliable processing (future enhancement)

### Performance Queue Integration (Future)
Events can be stored in the `queue_requests` collection with:
- `type`: `'TipActivated'`
- `mode`: `'fifo'` (First-In-First-Out processing)
- `payload`: Full TipActivated event payload
- `idempotencyKey`: Set to `tipId` to prevent duplicates
- `status`: `'pending'` initially
- `priority`: `10` (medium-high priority)

---

## Routing Patterns

### Event Consumers

**TipActivated Event Consumers (Current):**
- Event is emitted but not yet consumed
- No socket/side effects in current implementation
- Infrastructure is in place for future consumers

**TipActivated Event Consumers (Future):**
- Lovense toy activation service
- Analytics and reporting services
- Real-time notification services

### Channel Naming Convention

Channels follow the pattern: `{ENTITY}_{EVENT_TYPE}_CHANNEL`

Examples:
- `PURCHASED_ITEM_SUCCESS_CHANNEL` - Purchase completion events
- `TIP_ACTIVATED_CHANNEL` - Tip activation events (new)
- `ORDER_PAID_SUCCESS_CHANNEL` - Order payment events

### Event Flow (Future Implementation)
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

## Event Emission Rules

### When to Emit
1. Transaction must have `type === PURCHASE_ITEM_TYPE.TIP`
2. Transaction must have `status === PURCHASE_ITEM_STATUS.SUCCESS`
3. RRR ledger entry must have `posted_at != null` (SETTLED)
4. Event must NOT have been emitted previously for this `tipId` (checked via `tip_activated_event_logs`)

### Where Events Are Emitted
Events are emitted in `api/src/modules/purchased-item/listeners/post-tip-rrr-earn-and-emit.listener.ts`:
- After RRR earn event is posted
- After PurchasedItem is updated with RRR fields
- After event log record is created
- Before any downstream processing

### Error Handling
- If RRR API call fails, error is logged but transaction is not blocked
- If user is not linked to RRR, tip proceeds but no points are earned
- If event emission fails, error is logged for retry/investigation
- Failed emissions can be retried via admin tools (future enhancement)

---

## Migration Notes

### Schema Migration

When deploying this specification:

1. **PurchasedItem collection** will automatically add new fields on document updates (Mongoose schema)
2. **tip_activated_event_logs collection** will be created automatically by Mongoose
3. **Indexes** will be created automatically on first document insert

### Backfilling Existing Tips

For existing tips created before this implementation:
- RRR ledger fields (`rrrLedgerEntryId`, `rrrSourceRef`, `rrrPostedAt`) will be null
- No TipActivated events will be emitted retroactively
- Future tips will follow the full flow

---

## Testing

### Unit Test Requirements

1. **Idempotency Test:** Simulate concurrent emissions for the same PurchasedItem, verify only one event log record exists
2. **Status Filtering:** Verify events only emitted for SUCCESS status
3. **Settlement Filtering:** Verify events only emitted when RRR posted_at is non-null
4. **Non-Tip Filtering:** Verify non-tip purchases don't trigger events
5. **Duplicate Prevention:** Verify unique index prevents duplicate event logs

See: `api/src/modules/purchased-item/schemas/tip-activated-event-log.schema.spec.ts`

### Pre-Emission Validation Checks
1. Verify transaction exists and is valid
2. Confirm RRR settlement status (posted_at != null)
3. Check idempotency (has event been emitted before?)
4. Validate all required fields are present
5. Ensure numeric fields are non-negative

---

## Security Considerations

1. **No Sensitive Data:** Event payloads contain only IDs and amounts, no PII
2. **Audit Trail:** Every event emission is logged in `tip_activated_event_logs`
3. **Idempotency:** Multiple safeguards prevent duplicate events
4. **Rate Limiting:** RRR API calls use idempotency keys to prevent duplicate charges

### Data Retention
- Event logs retained indefinitely for audit purposes
- Events can be archived to long-term storage as needed
- Audit queries must have access to historical events

### Privacy Considerations
- Do NOT include sensitive personal information beyond IDs
- Usernames are acceptable for operational purposes
- Balance information (if included) is for audit trail only

---

## Examples

### Minimal TipActivated Event (Required Fields Only)
```json
{
  "tipId": "507f1f77bcf86cd799439011",
  "eventId": "a1b2c3d4-e5f6-4789-a012-3456789abcde",
  "eventType": "TipActivated",
  "eventTimestamp": "2026-01-03T04:15:00.000Z",
  "amount": 100,
  "tipper": {
    "userId": "507f191e810c19729de860ea"
  },
  "recipient": {
    "performerId": "507f191e810c19729de860eb"
  },
  "ledger": {
    "transactionId": "507f1f77bcf86cd799439011",
    "sourceRef": "purchasedItem:507f1f77bcf86cd799439011",
    "entryId": "rrr-entry-12345",
    "postedAt": "2026-01-03T04:15:00.000Z"
  },
  "createdAt": "2026-01-03T04:14:58.000Z"
}
```

### Complete TipActivated Event (All Fields)
```json
{
  "tipId": "507f1f77bcf86cd799439011",
  "eventId": "a1b2c3d4-e5f6-4789-a012-3456789abcde",
  "eventType": "TipActivated",
  "eventTimestamp": "2026-01-03T04:15:00.000Z",
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
  "amount": 100,
  "netPrice": 75,
  "commission": 25,
  "studioCommission": 10,
  "ledger": {
    "transactionId": "507f1f77bcf86cd799439011",
    "conversationId": "507f191e810c19729de860ed",
    "sourceRef": "purchasedItem:507f1f77bcf86cd799439011",
    "entryId": "rrr-entry-12345",
    "postedAt": "2026-01-03T04:15:00.000Z",
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
  "context": {
    "conversationType": "private",
    "streamType": "private",
    "customMessage": "Great performance!"
  },
  "createdAt": "2026-01-03T04:14:58.000Z",
  "processed": false
}
```

---

## Migration Path

### Phase 1: Event Emission (Current Implementation)
- ✅ Create specification document
- ✅ Add RRR tracking fields to PurchasedItem schema
- ✅ Implement TipActivated event emission
- ✅ Integrate with RRR ledger API
- ✅ Enforce idempotency via event log
- ❌ NO toy activation yet
- ❌ NO performance queue persistence yet

### Phase 2: Event Processing (Future PR)
- Create Lovense Activation Service
- Subscribe to TipActivated events
- Implement toy command dispatch
- Add configuration for per-tip activation rules
- Integrate with performance queue for reliability

### Phase 3: Advanced Features (Future)
- Menu-driven activation patterns
- Custom vibration sequences
- Activation analytics
- Admin monitoring dashboard
- Balance tracking in events

---

## Future Enhancements

### Planned Features

1. **Toy Dispatch Service:** Consume TipActivated events and trigger Lovense toys
2. **Intensity Mapping:** Map tip amounts to vibration intensity patterns
3. **Duration Control:** Configure activation duration based on tip amount
4. **Pattern Library:** Support custom vibration patterns per performer
5. **Analytics Dashboard:** Track tip-to-activation metrics
6. **Performance Queue Integration:** Reliable event persistence and processing

### Potential Schema Extensions

Future versions may add:
- `vibrationPattern` field to specify toy activation pattern
- `duration` field for activation length
- `toyIds` array for multi-toy support
- `performerPreferences` object for customization
- `settlementStatus` as separate field (vs. deriving from posted_at)
- Commission and balance tracking fields as standard

---

## References

- **RRR API Contract:** `/REDROOMREWARDS_XXXCHATNOW_API_CONTRACT_v1.md`
- **RRR Integration Guide:** `/REDROOMREWARDS_INTEGRATION_GUIDE.md`
- **Performance Queue Architecture:** `/PERFORMANCE_QUEUE_ARCHITECTURE.md`
- **Lovense Integration Evaluation:** `/LOVENSE_INTEGRATION_EVALUATION.md`
- **Security Audit Policy:** `/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- **Copilot Governance:** `/COPILOT_GOVERNANCE.md`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-03 | GitHub Copilot | Initial specification with TipActivated event definition, merged with main branch requirements |

---

## Glossary

- **RRR:** RedRoomRewards - External loyalty points system
- **Ledger Entry:** A record in RRR's ledger tracking points earned or redeemed
- **Posted:** RRR term for a finalized/settled ledger entry (posted_at != null)
- **Pending:** RRR term for an unfinalized ledger entry (posted_at == null)
- **sourceRef:** Deterministic reference used for RRR idempotency and reconciliation
- **Idempotency:** Property ensuring an operation can be safely retried without side effects
- **SETTLED:** State indicating transaction is complete and cannot be reversed

---

**Document Owner:** Backend Team  
**Document Status:** Active  
**Review Cycle:** Quarterly or on major feature changes  
**Approval Required For:** Changes to event payload structure, routing patterns, or idempotency guarantees  
**Next Review:** After Phase 2 implementation complete
