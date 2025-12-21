# SM (Slot Machine) Queue System Documentation

## Overview

The SM Queue System implements a per-model queuing mechanism for slot machine games, ensuring only ONE active game per model at any time, with support for user queuing, overflow handling, and automatic refunds.

## Architecture

### Key Components

1. **SM-Queue-Entry Schema** - Tracks users waiting in queue
2. **SM-Game-Session Schema** - Tracks active game sessions
3. **SM-Payout-Transaction Schema** - Immutable transaction records
4. **SM-Queue Service** - Queue management logic
5. **SM-Payout Service** - Token debit/credit operations
6. **SM-Ledger-Client Service** - Ledger API integration with circuit breaker
7. **SM-Audit Service** - Complete audit trail

## Key Features

### 1. Per-Model Queue Management

- Each model (performer) has their own queue
- FIFO (First In, First Out) ordering
- Configurable queue capacity (default: 10 users)
- Position tracking and estimated wait times

### 2. One Active Game Per Model

Enforced at database level with partial unique index:
```javascript
// Only one active/initializing session per performer
{
  performerId: 1
},
{
  unique: true,
  partialFilterExpression: {
    status: { $in: ['initializing', 'active'] }
  }
}
```

### 3. Ledger Integration with Circuit Breaker

System **MUST NOT** start new games when Ledger API is down:

```typescript
// Check before allowing queue join
const ledgerHealth = await this.ledgerClient.checkHealth();
if (!ledgerHealth.isHealthy) {
  throw new HttpException(
    'Slot machine is temporarily unavailable',
    HttpStatus.SERVICE_UNAVAILABLE
  );
}
```

Circuit breaker states:
- **CLOSED**: Normal operation
- **OPEN**: Ledger down, reject all requests
- **HALF_OPEN**: Testing recovery

Configuration:
- Failure threshold: 5 consecutive failures
- Recovery timeout: 30 seconds
- Half-open max attempts: 3

### 4. Overflow and Abandonment Handling

**Queue Full (Overflow)**:
- New users rejected with clear error message
- Existing users remain in queue
- No automatic rope-drop (by design)

**User Abandons Queue**:
- Entry fee automatically refunded
- Queue positions rebalanced
- Complete audit trail maintained

**Queue Timeout**:
- Configurable timeout (default: 10 minutes)
- Automatic cleanup via periodic job
- Entry fee refunded
- Status marked as `expired`

### 5. Immutable Transaction Records

Each prize fulfillment = ONE immutable transaction:

```typescript
// Debit for queue entry
const debitTxn = await payoutService.processDebit({
  userId,
  performerId,
  amount: entryFee,
  idempotencyKey,
  metadata: { reason: 'slot_machine_queue_entry' }
});

// Credit for winnings
const creditTxn = await payoutService.processCredit({
  userId,
  performerId,
  amount: payout,
  idempotencyKey: newIdempotencyKey,
  prizeData: { symbols, multiplier, payout },
  metadata: { reason: 'slot_machine_win' }
});

// Refund for abandonment
const refundTxn = await payoutService.processRefund({
  userId,
  performerId,
  amount: entryFee,
  idempotencyKey: refundKey,
  metadata: {
    reason: 'slot_machine_queue_abandonment',
    abandonmentNote: 'user_left'
  }
});
```

### 6. Complete Audit Trail

All operations tracked with:
- User ID and Performer ID
- Timestamps (initiated, processed, completed)
- Prize data and outcome
- Duration in milliseconds
- Abandonment notes (if applicable)
- Ledger transaction references
- Integrity hashes for tamper detection

**No PII in audit logs** - Only IDs are stored.

## API Endpoints

### User Endpoints

#### POST `/api/v1/slot-machine/queue/join`

Join queue for a specific model.

**Request:**
```json
{
  "performerId": "507f1f77bcf86cd799439011",
  "entryFee": 100,
  "idempotencyKey": "idempotency_1234567890_abc"
}
```

**Response:**
```json
{
  "queueId": "queue_1734822389000_abc123",
  "userId": "507f1f77bcf86cd799439011",
  "performerId": "507f1f77bcf86cd799439012",
  "position": 3,
  "entryFee": 100,
  "status": "waiting",
  "joinedAt": "2025-12-21T23:00:00.000Z",
  "expiresAt": "2025-12-21T23:10:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Already in queue
- `503 Service Unavailable` - Queue full or Ledger unavailable

#### DELETE `/api/v1/slot-machine/queue/leave`

Leave queue and receive refund.

**Request:**
```json
{
  "performerId": "507f1f77bcf86cd799439011",
  "reason": "user_left"
}
```

**Response:** `204 No Content`

#### GET `/api/v1/slot-machine/queue/status`

Get queue status for a model.

**Query Parameters:**
- `performerId` (required)

**Response:**
```json
{
  "performerId": "507f1f77bcf86cd799439011",
  "queueLength": 5,
  "hasActiveSession": true,
  "userPosition": 3,
  "estimatedWaitTimeMs": 360000,
  "canJoin": true
}
```

## Queue Workflow

### 1. User Joins Queue

```
User → POST /queue/join
  ↓
Check Ledger health (MUST be healthy)
  ↓
Check user not already in queue
  ↓
Check queue not full (< MAX_QUEUE_SIZE)
  ↓
Process entry fee DEBIT via Ledger API
  ↓
Create queue entry (status: WAITING)
  ↓
Return queue position and estimated wait
```

### 2. Start Next Game

```
Cron Job / Event Trigger
  ↓
Check no active session for model
  ↓
Get next user from queue (FIFO)
  ↓
Create game session (status: INITIALIZING)
  ↓
Update queue entry (status: ACTIVE)
  ↓
Update session (status: ACTIVE)
  ↓
Game proceeds...
```

### 3. User Leaves Queue

```
User → DELETE /queue/leave
  ↓
Find user's queue entry
  ↓
Process REFUND for entry fee
  ↓
Update entry (status: REFUNDED)
  ↓
Rebalance queue positions
  ↓
Return success
```

### 4. Queue Timeout Cleanup

```
Periodic Cron Job (every 5 minutes)
  ↓
Find expired entries (expiresAt <= NOW)
  ↓
For each expired entry:
  Process REFUND
  Update status to EXPIRED
  Log abandonment reason
  ↓
Return count of cleaned entries
```

## Database Schema

### sm_queue_entries

| Field | Type | Description |
|-------|------|-------------|
| queueId | String | Unique queue entry ID |
| userId | ObjectId | User waiting in queue |
| performerId | ObjectId | Model user wants to play with |
| position | Number | Position in queue (0-based) |
| entryFee | Number | Tokens paid to enter queue |
| status | Enum | waiting, active, completed, abandoned, refunded, expired |
| joinedAt | Date | When user joined queue |
| expiresAt | Date | When queue entry expires |
| gameSessionId | String | Reference to active session |
| ledgerTransactionId | String | Reference to Ledger debit |
| refundTransactionId | String | Reference to refund if abandoned |

**Indexes:**
- `{ queueId: 1 }` - Unique
- `{ idempotencyKey: 1 }` - Unique
- `{ performerId: 1, status: 1, position: 1 }` - Queue lookup
- `{ userId: 1, status: 1, createdAt: -1 }` - User history

### sm_game_sessions

| Field | Type | Description |
|-------|------|-------------|
| sessionId | String | Unique session ID |
| userId | ObjectId | User playing game |
| performerId | ObjectId | Model in game |
| queueId | String | Reference to queue entry |
| status | Enum | initializing, active, completed, abandoned, failed, refunded |
| betAmount | Number | Tokens per spin |
| totalSpins | Number | Total spins in session |
| totalWinnings | Number | Total winnings |
| totalLosses | Number | Total losses |
| startedAt | Date | Session start time |
| completedAt | Date | Session end time |
| durationMs | Number | Session duration |

**Indexes:**
- `{ sessionId: 1 }` - Unique
- `{ performerId: 1 }` - Unique when status is active/initializing
- `{ userId: 1, status: 1, startedAt: -1 }` - User sessions

### sm_payout_transactions

| Field | Type | Description |
|-------|------|-------------|
| transactionId | String | Unique transaction ID |
| idempotencyKey | String | Idempotency key |
| userId | ObjectId | User |
| performerId | ObjectId | Model |
| type | Enum | debit, credit, refund |
| status | Enum | pending, processing, completed, failed, reversed |
| amount | Number | Token amount |
| balanceBefore | Number | Balance before transaction |
| balanceAfter | Number | Balance after transaction |
| prizeData | Object | Prize details (for wins) |
| integrityHash | String | SHA-256 hash for tamper detection |

**Indexes:**
- `{ transactionId: 1 }` - Unique
- `{ idempotencyKey: 1 }` - Unique
- `{ userId: 1, type: 1, createdAt: -1 }` - User transactions
- `{ ledgerTransactionId: 1 }` - Ledger reconciliation

## Security Features

### 1. Idempotency

All operations require idempotency keys:
- Queue join
- Debit transactions
- Credit transactions
- Refund transactions

Prevents duplicate operations on retry.

### 2. Server-Side Only Calculations

- All game outcomes calculated server-side
- Client input never trusted
- Balance validation before operations

### 3. Atomic Operations

MongoDB transactions ensure:
- No partial state changes
- Rollback on error
- Consistent data

### 4. Audit Trail

Complete audit trail with:
- Immutable transaction records
- Integrity hashes
- No PII in logs (IDs only)
- 8-year retention policy

### 5. Circuit Breaker

Protects against Ledger API failures:
- Automatic detection of failures
- System halt when Ledger is down
- Automatic recovery testing
- Clear error messages to users

## Configuration

Located in `SM-Queue Service`:

```typescript
private readonly MAX_QUEUE_SIZE = 10;          // Max users per model
private readonly QUEUE_TIMEOUT_MS = 600000;    // 10 minutes
private readonly AVG_GAME_DURATION_MS = 120000; // 2 minutes
```

## Monitoring & Alerts

### Key Metrics

1. **Queue Length** - Monitor per model
2. **Average Wait Time** - Track across all models
3. **Abandonment Rate** - Track refunds vs completions
4. **Ledger Health** - Circuit breaker state
5. **Transaction Processing Time** - Debit/Credit duration

### Alerts

- Queue consistently at max capacity
- High abandonment rate (> 30%)
- Circuit breaker OPEN for > 5 minutes
- Transaction processing time > 5 seconds
- Unusual refund volume

## Periodic Jobs

### 1. Queue Cleanup (Every 5 minutes)

```typescript
@Cron('*/5 * * * *')
async cleanupExpiredEntries() {
  await this.queueService.cleanupExpiredEntries();
}
```

### 2. Archival (Daily)

```typescript
@Cron('0 2 * * *') // 2 AM daily
async archiveOldRecords() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 18); // 18 months
  await this.auditService.archiveOldRecords(cutoffDate);
}
```

## Testing

### Unit Tests

- Circuit breaker state transitions
- Idempotency enforcement
- Queue position calculations
- Refund logic

### Integration Tests

- Complete queue join → game → complete flow
- Queue overflow handling
- Abandonment and refund flow
- Ledger unavailable scenario

### Load Tests

- 100 concurrent users per model
- Queue at max capacity
- Multiple models simultaneously
- Ledger latency simulation

## Production Checklist

- [ ] Configure queue size per model
- [ ] Set appropriate timeouts
- [ ] Configure Ledger API endpoint
- [ ] Set up monitoring dashboards
- [ ] Configure alerting thresholds
- [ ] Test circuit breaker behavior
- [ ] Run load tests
- [ ] Document operational procedures
- [ ] Train support team on queue system
- [ ] Prepare user-facing documentation

## Troubleshooting

### Queue is always full

Check:
1. Game sessions completing properly
2. Average game duration configuration
3. Consider increasing MAX_QUEUE_SIZE

### Users getting "Ledger unavailable" errors

Check:
1. Circuit breaker state: `GET /admin/slot-machine/circuit-status`
2. Ledger API health
3. Network connectivity
4. Circuit breaker timeout configuration

### Refunds not processing

Check:
1. Ledger API credit endpoint
2. Idempotency key conflicts
3. Transaction logs in sm_payout_transactions

## Future Enhancements

1. **Priority Queue** - VIP users skip ahead
2. **Dynamic Queue Size** - Adjust based on demand
3. **Queue Reservations** - Reserve spot for future time
4. **Multi-game Sessions** - Multiple spins per session
5. **WebSocket Updates** - Real-time queue position updates
6. **Analytics Dashboard** - Queue metrics and insights

## References

- [XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md](../../../XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md) - Original briefing
- [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](../../../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md) - Security requirements
- [MASTER_TRANSITION_AND_INTEGRATION_BRIEFING.md](../../../MASTER_TRANSITION_AND_INTEGRATION_BRIEFING.md) - Ledger integration
