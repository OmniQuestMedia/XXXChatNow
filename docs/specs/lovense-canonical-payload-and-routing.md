# Lovense Canonical Payload and Routing Specification

## Overview

This document defines the canonical payload structure for TipActivated events and how they should be routed for Lovense integration. The TipActivated event is emitted when a tip transaction is finalized and confirmed by the RedRoomRewards (RRR) ledger system.

## Event Source of Truth

**The RRR ledger entry is the single source of truth for tip activation.**

- Events are ONLY emitted when RRR returns a ledger entry with `posted_at` set
- `posted_at != null` is treated as canonical `ledger.status = "SETTLED"`
- If `posted_at` is missing/null, NO event is emitted

## TipActivated Event Payload

### Payload Structure

```typescript
interface TipActivatedDto {
  // Transaction Identifiers
  tipId: string;              // MongoDB ObjectId of the tip transaction
  userId: string;             // User who sent the tip
  performerId: string;        // Performer who received the tip
  conversationId?: string;    // Optional conversation ID where tip was sent

  // Transaction Details
  amount: number;             // Tip amount in tokens

  // RRR Ledger Information (Source of Truth)
  ledger: TipActivatedLedgerDto;

  // Timestamps
  createdAt: string;          // ISO 8601 timestamp when tip was created
}
```

### Ledger Information Structure

```typescript
interface TipActivatedLedgerDto {
  // RRR Ledger Fields
  ledgerId: string;           // RRR entry_id (string)
  sourceRef: string;          // RRR source_ref (string, required)
  debitRef: string | null;    // Debit-side entry_id or null
  creditRef: string | null;   // Credit-side entry_id or null
  
  // Status
  status: 'SETTLED';          // Always SETTLED when posted_at is set
  
  // Timestamp
  postedAt: string;           // ISO 8601 timestamp when ledger entry was posted
}
```

## Ledger Field Mapping

### From RRR API to Event Payload

| RRR Field | Event Field | Notes |
|-----------|-------------|-------|
| `entry_id` | `ledger.ledgerId` | RRR ledger entry ID (string) |
| `source_ref` | `ledger.sourceRef` | RRR source reference (string, required) |
| `posted_at` | `ledger.postedAt` | ISO 8601 timestamp (required for emission) |

### Debit/Credit Reference Handling

**If RRR returns TWO entries for the same source_ref:**
- Example: TRANSFER_OUT + TRANSFER_IN
- Set `ledger.debitRef` = debit-side `entry_id`
- Set `ledger.creditRef` = credit-side `entry_id`

**If RRR returns ONE entry:**
- Set `ledger.debitRef` = `null`
- Set `ledger.creditRef` = `null`

**CRITICAL: DO NOT invent debit/credit refs. DO NOT set them to source_ref.**

## Idempotency

### Event Log Collection: `tip_activated_event_log`

Events are tracked in MongoDB to ensure idempotency:

```typescript
interface TipActivatedEventLog {
  tipId: string;              // Unique key - prevents duplicate emissions
  eventId: string;            // UUID of the event
  ledgerId: string;           // RRR ledger entry ID
  sourceRef: string;          // RRR source reference
  postedAt: Date;             // When ledger was posted
  payloadHash: string;        // SHA256 hash of payload for integrity
  createdAt: Date;            // When event was persisted
}
```

### Idempotency Rules

1. **Check Before Emit**: Query `tip_activated_event_log` by `tipId` before emitting
2. **If Record Exists**: Skip emission (no-op, idempotent)
3. **If No Record**: Persist event then emit
4. **Race Condition Handling**: Duplicate key errors (E11000) are caught and treated as successful idempotency

## Event Routing

### Channel

```typescript
const TIP_ACTIVATED_CHANNEL = 'TIP_ACTIVATED_CHANNEL';
```

### Event Name

```typescript
eventName: 'TipActivated'
```

### Queue Event Structure

```typescript
new QueueEvent({
  channel: TIP_ACTIVATED_CHANNEL,
  eventName: 'TipActivated',
  data: tipActivatedPayload  // TipActivatedDto
})
```

## Implementation Notes

### Phase 1: Emit + Persist (Current)

- Emit TipActivated event when tip is finalized
- Persist event to `tip_activated_event_log`
- **NO Lovense dispatch in this phase**

### Phase 2: Lovense Integration (Future)

- Subscribe to `TIP_ACTIVATED_CHANNEL`
- Process TipActivated events
- Dispatch to Lovense API for toy activation

## Example Payload

```json
{
  "tipId": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "performerId": "507f191e810c19729de860eb",
  "conversationId": "507f191e810c19729de860ec",
  "amount": 100,
  "ledger": {
    "ledgerId": "rrr_entry_abc123",
    "sourceRef": "TIP_507f1f77bcf86cd799439011",
    "debitRef": "rrr_entry_debit456",
    "creditRef": "rrr_entry_credit789",
    "status": "SETTLED",
    "postedAt": "2025-12-23T18:00:00.000Z"
  },
  "createdAt": "2025-12-23T18:00:00.000Z"
}
```

## Security Considerations

1. **Never log sensitive data**: User IDs, transaction details should not be logged in plain text
2. **Payload integrity**: Use SHA256 hash to verify payload hasn't been tampered with
3. **Idempotency key**: `tipId` serves as natural idempotency key
4. **RRR as source of truth**: Only trust ledger data from RRR API, never client-provided data

## Testing Requirements

### Unit Tests

- ✅ Duplicate `tipId` does not emit twice (idempotency)
- ✅ Event is persisted before emission
- ✅ No emission if `posted_at` is null/missing
- ✅ Correct mapping of RRR ledger fields
- ✅ Debit/credit ref handling (both set or both null)

### Integration Tests

- RRR ledger query with `source_ref`
- Event emission to queue
- Event log persistence
- Race condition handling (concurrent emissions)

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-03 | 1.0 | Initial specification with sourceRef field |

## References

- [RRR API Contract](../../REDROOMREWARDS_API_CONTRACT_v1.md)
- [RRR Integration Guide](../../REDROOMREWARDS_INTEGRATION_GUIDE.md)
- [Security Audit Policy](../../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
