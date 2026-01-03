# Lovense Canonical Payload and Routing Specification

## Document Information
- **Version:** 1.0.0
- **Last Updated:** 2026-01-03
- **Status:** Active
- **Purpose:** Define canonical event payloads and routing for Lovense toy integration

---

## Overview

This document specifies the canonical event payload structures and routing patterns for the Lovense toy integration within XXXChatNow. These events are emitted when specific user actions trigger toy activations.

---

## Event Types

### 1. TipActivated Event

**Channel:** `TIP_ACTIVATED_CHANNEL`

**Event Name:** `CREATED`

**Description:** Emitted when a tip purchase is successfully processed AND the RRR (RedRoomRewards) ledger entry has been settled (posted).

**Timing:** This event is only emitted after BOTH conditions are met:
1. `PurchasedItem.status === 'success'`
2. RRR ledger entry has `posted_at != null` (indicating settlement)

**Idempotency:** Event emission is idempotent via the `tip_activated_event_log` collection with a unique index on `tipId`. Duplicate emissions are prevented at the database level.

#### Payload Structure

```typescript
{
  // Tip identification
  tipId: string;              // String form of PurchasedItem._id (NOT a new UUID)
  eventId: string;            // Unique UUID for this event emission
  
  // Transaction participants
  userId: string;             // User who sent the tip (sourceId)
  performerId: string;        // Performer who received the tip (sellerId)
  
  // Transaction details
  amount: number;             // Tip amount in tokens
  conversationId: string;     // Conversation where tip was sent (targetId)
  createdAt: string;          // ISO 8601 timestamp of tip creation
  
  // Ledger integration (RRR - RedRoomRewards)
  ledger: {
    entryId: string;          // RRR ledger entry ID
    sourceRef: string;        // REQUIRED - Deterministic reference: 'purchasedItem:{_id}'
    postedAt: string;         // ISO 8601 timestamp when RRR posted the entry (SETTLED)
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tipId` | string | Yes | The string form of the PurchasedItem._id. This serves as the stable identifier for the tip across all systems. |
| `eventId` | string | Yes | A unique UUID generated for this specific event emission. Used for event tracing and deduplication. |
| `userId` | string | Yes | MongoDB ObjectId (as string) of the user who sent the tip. |
| `performerId` | string | Yes | MongoDB ObjectId (as string) of the performer who received the tip. |
| `amount` | number | Yes | The tip amount in platform tokens. |
| `conversationId` | string | Yes | MongoDB ObjectId (as string) of the conversation where the tip was sent. |
| `createdAt` | string | Yes | ISO 8601 formatted timestamp of when the tip was created. |
| `ledger.entryId` | string | Yes | The unique RRR ledger entry identifier returned from the RRR API. |
| `ledger.sourceRef` | string | Yes | Deterministic source reference in format `purchasedItem:{_id}`. Used for reconciliation and idempotency at the RRR level. |
| `ledger.postedAt` | string | Yes | ISO 8601 formatted timestamp when RRR posted (settled) the ledger entry. A non-null value indicates SETTLED status. |

#### RRR Integration Notes

**Important:** RRR (RedRoomRewards) has no explicit "status" field in ledger entries. The settlement status is derived from the `posted_at` field:

- **SETTLED:** `posted_at != null` - The entry has been finalized and points have been awarded
- **PENDING:** `posted_at == null` - The entry exists but has not been settled yet

**TipActivated events are ONLY emitted when the ledger entry is SETTLED** (i.e., `posted_at != null`).

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
  
  // RRR ledger tracking
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

1. **RRR Level:** Idempotency-Key header prevents duplicate earn events
2. **Database Level:** Unique index on `tip_activated_event_logs.tipId` prevents duplicate event records
3. **Application Level:** Check for existing event log before emission

**Concurrent Emission Protection:**

If multiple processes attempt to emit TipActivated for the same tip concurrently:
- First process succeeds in inserting event log record
- Subsequent processes fail with duplicate key error (code 11000)
- Application treats duplicate key error as no-op
- Result: Exactly one TipActivated event is emitted

---

## Routing Patterns

### Event Consumers

**TipActivated Event Consumers:**
- Lovense toy activation service (future)
- Analytics and reporting services (future)
- Real-time notification services (future)

**Current Implementation:**
- Events are emitted but not yet consumed
- No socket/side effects in this implementation
- Infrastructure is in place for future consumers

### Channel Naming Convention

Channels follow the pattern: `{ENTITY}_{EVENT_TYPE}_CHANNEL`

Examples:
- `PURCHASED_ITEM_SUCCESS_CHANNEL` - Purchase completion events
- `TIP_ACTIVATED_CHANNEL` - Tip activation events (new)
- `ORDER_PAID_SUCCESS_CHANNEL` - Order payment events

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

See: `api/src/modules/purchased-item/listeners/post-tip-rrr-earn-and-emit.listener.spec.ts`

---

## Security Considerations

1. **No Sensitive Data:** Event payloads contain only IDs and amounts, no PII
2. **Audit Trail:** Every event emission is logged in `tip_activated_event_logs`
3. **Idempotency:** Multiple safeguards prevent duplicate events
4. **Rate Limiting:** RRR API calls use idempotency keys to prevent duplicate charges

---

## Future Enhancements

### Planned Features

1. **Toy Dispatch Service:** Consume TipActivated events and trigger Lovense toys
2. **Intensity Mapping:** Map tip amounts to vibration intensity patterns
3. **Duration Control:** Configure activation duration based on tip amount
4. **Pattern Library:** Support custom vibration patterns per performer
5. **Analytics Dashboard:** Track tip-to-activation metrics

### Potential Schema Extensions

Future versions may add:
- `vibrationPattern` field to specify toy activation pattern
- `duration` field for activation length
- `toyIds` array for multi-toy support
- `performerPreferences` object for customization

---

## References

- **RRR API Contract:** `/REDROOMREWARDS_XXXCHATNOW_API_CONTRACT_v1.md`
- **RRR Integration Guide:** `/REDROOMREWARDS_INTEGRATION_GUIDE.md`
- **Security Audit Policy:** `/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- **Copilot Governance:** `/COPILOT_GOVERNANCE.md`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-03 | GitHub Copilot | Initial specification with TipActivated event definition |

---

## Glossary

- **RRR:** RedRoomRewards - External loyalty points system
- **Ledger Entry:** A record in RRR's ledger tracking points earned or redeemed
- **Posted:** RRR term for a finalized/settled ledger entry (posted_at != null)
- **Pending:** RRR term for an unfinalized ledger entry (posted_at == null)
- **sourceRef:** Deterministic reference used for RRR idempotency and reconciliation
- **Idempotency:** Property ensuring an operation can be safely retried without side effects

---

**Document Owner:** Backend Team  
**Review Cycle:** Quarterly or on major feature changes  
**Approval Required For:** Changes to event payload structure, routing patterns, or idempotency guarantees
