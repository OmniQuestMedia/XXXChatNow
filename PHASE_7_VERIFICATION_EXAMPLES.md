# PHASE 7 (STAGE MANAGER) Verification Examples

This document provides example API requests and expected behavior for the PHASE 7 QUEUED execution mode implementation.

## Overview

Phase 7 adds support for queued execution of tip grid item purchases. When a tip grid item is purchased with `executionMode: 'QUEUED'`, the system:

1. Creates a `PurchasedItem` with `status = PENDING`
2. Enqueues a job to the PerformanceQueue
3. Returns immediately with queue information
4. Settlement occurs ONLY when the queued job completes

## API Endpoints

### Purchase Tip Grid Item

**Endpoint:** `POST /api/tip-grid/purchase`

**Authentication:** Required (User JWT)

## Example 1: IMMEDIATE Mode (Existing Behavior - Phase 2)

### Request
```json
POST /api/tip-grid/purchase
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "tipMenuItemId": "507f1f77bcf86cd799439011",
  "performerId": "507f1f77bcf86cd799439012",
  "conversationId": "507f1f77bcf86cd799439013",
  "idempotencyKey": "unique-key-immediate-001",
  "executionMode": "IMMEDIATE"
}
```

### Response
```json
{
  "success": true,
  "transactionId": "507f1f77bcf86cd799439014",
  "message": "Tip grid item purchased successfully"
}
```

### Expected Behavior
1. ✅ `PurchasedItem` created with `status = SUCCESS`
2. ✅ Immediately published to `PURCHASED_ITEM_SUCCESS_CHANNEL`
3. ✅ Settlement occurs immediately
4. ✅ User balance debited immediately
5. ✅ Performer balance credited immediately

---

## Example 2: QUEUED Mode (New Phase 7 Behavior)

### Request
```json
POST /api/tip-grid/purchase
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "tipMenuItemId": "507f1f77bcf86cd799439011",
  "performerId": "507f1f77bcf86cd799439012",
  "conversationId": "507f1f77bcf86cd799439013",
  "idempotencyKey": "unique-key-queued-001",
  "executionMode": "QUEUED"
}
```

### Response
```json
{
  "success": true,
  "queueRequestId": "abc123-def456-ghi789",
  "purchasedItemId": "507f1f77bcf86cd799439015",
  "message": "Tip grid item queued for processing",
  "queuePosition": 5
}
```

### Expected Behavior

#### Phase 1: Request Submission
1. ✅ `PurchasedItem` created with `status = PENDING`
2. ✅ `extraInfo.executionMode = 'QUEUED'`
3. ✅ NOT published to `PURCHASED_ITEM_SUCCESS_CHANNEL` yet
4. ✅ Job enqueued to PerformanceQueue with:
   - `type: 'tip_grid_item_queued'`
   - `payload`: { purchasedItemId, performerId, userId, tipMenuId, tipGridItemId }
   - `idempotencyKey`: from request or generated
5. ✅ User balance NOT debited yet
6. ✅ Settlement NOT triggered yet

#### Phase 2: Queue Processing (When Job Completes)
1. ✅ Queue processor invoked with payload
2. ✅ `PurchasedItem` status updated from `PENDING` → `SUCCESS`
3. ✅ NOW published to `PURCHASED_ITEM_SUCCESS_CHANNEL`
4. ✅ Settlement triggered by PaymentTokenListener
5. ✅ User balance debited
6. ✅ Performer balance credited

---

## Example 3: Check Queue Status

### Request
```json
GET /api/performance-queue/status/<queueRequestId>
Authorization: Bearer <user-jwt-token>
```

### Response (While Pending)
```json
{
  "requestId": "abc123-def456-ghi789",
  "status": "pending",
  "retryCount": 0,
  "createdAt": "2026-01-04T07:00:00.000Z"
}
```

### Response (After Completion)
```json
{
  "requestId": "abc123-def456-ghi789",
  "status": "completed",
  "retryCount": 0,
  "result": {
    "success": true,
    "message": "Tip grid item processed and published for settlement",
    "purchasedItemId": "507f1f77bcf86cd799439015"
  },
  "createdAt": "2026-01-04T07:00:00.000Z",
  "completedAt": "2026-01-04T07:00:05.000Z"
}
```

---

## Example 4: Default Execution Mode

### Request (No executionMode specified)
```json
POST /api/tip-grid/purchase
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "tipMenuItemId": "507f1f77bcf86cd799439011",
  "performerId": "507f1f77bcf86cd799439012"
}
```

### Expected Behavior
- ✅ Defaults to `IMMEDIATE` mode (backward compatible)
- ✅ Behaves exactly like Example 1

---

## Example 5: Idempotency in QUEUED Mode

### First Request
```json
POST /api/tip-grid/purchase
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "tipMenuItemId": "507f1f77bcf86cd799439011",
  "performerId": "507f1f77bcf86cd799439012",
  "idempotencyKey": "duplicate-key-test",
  "executionMode": "QUEUED"
}
```

### Response
```json
{
  "success": true,
  "queueRequestId": "first-queue-id",
  "purchasedItemId": "507f1f77bcf86cd799439016",
  "message": "Tip grid item queued for processing",
  "queuePosition": 1
}
```

### Second Request (Duplicate)
```json
POST /api/tip-grid/purchase
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "tipMenuItemId": "507f1f77bcf86cd799439011",
  "performerId": "507f1f77bcf86cd799439012",
  "idempotencyKey": "duplicate-key-test",
  "executionMode": "QUEUED"
}
```

### Response (Error)
```json
{
  "statusCode": 400,
  "message": "Duplicate request detected. Transaction already processed.",
  "error": "Bad Request"
}
```

---

## Verification Checklist

### IMMEDIATE Mode Verification
- [ ] PurchasedItem created with `status = SUCCESS`
- [ ] Event published to `PURCHASED_ITEM_SUCCESS_CHANNEL` immediately
- [ ] Settlement occurs immediately
- [ ] User balance debited immediately
- [ ] Performer balance credited immediately

### QUEUED Mode Verification
- [ ] PurchasedItem created with `status = PENDING`
- [ ] Job enqueued to PerformanceQueue
- [ ] Response includes `queueRequestId` and `purchasedItemId`
- [ ] NO immediate publication to `PURCHASED_ITEM_SUCCESS_CHANNEL`
- [ ] NO immediate settlement
- [ ] User balance NOT debited yet

### Queue Completion Verification
- [ ] Queue processor updates PurchasedItem status to `SUCCESS`
- [ ] Event published to `PURCHASED_ITEM_SUCCESS_CHANNEL` ONLY after job completion
- [ ] Settlement triggered ONLY after job completion
- [ ] User balance debited ONLY after job completion
- [ ] Performer balance credited ONLY after job completion

### Idempotency Verification
- [ ] Duplicate `idempotencyKey` rejected in both modes
- [ ] PerformanceQueue enforces idempotency for queued jobs
- [ ] No double-settlement in either mode

---

## Database State Examples

### PurchasedItem Schema

#### IMMEDIATE Mode
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  source: "user",
  sourceId: ObjectId("507f1f77bcf86cd799439020"),
  target: "tip",
  targetId: ObjectId("507f1f77bcf86cd799439013"),
  sellerId: ObjectId("507f1f77bcf86cd799439012"),
  type: "tip_grid_item",
  name: "Test Tip",
  description: "Test tip description",
  price: 100,
  quantity: 1,
  totalPrice: 100,
  originalPrice: 100,
  status: "success",                    // ← IMMEDIATE: status = SUCCESS
  settlementStatus: "pending",           // ← Will be processed by listener
  extraInfo: {
    tipMenuItemId: ObjectId("507f1f77bcf86cd799439011"),
    conversationId: ObjectId("507f1f77bcf86cd799439013")
  },
  idempotencyKey: "unique-key-immediate-001",
  createdAt: ISODate("2026-01-04T07:00:00.000Z"),
  updatedAt: ISODate("2026-01-04T07:00:00.000Z")
}
```

#### QUEUED Mode (Before Processing)
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  source: "user",
  sourceId: ObjectId("507f1f77bcf86cd799439020"),
  target: "tip",
  targetId: ObjectId("507f1f77bcf86cd799439013"),
  sellerId: ObjectId("507f1f77bcf86cd799439012"),
  type: "tip_grid_item",
  name: "Test Tip",
  description: "Test tip description",
  price: 100,
  quantity: 1,
  totalPrice: 100,
  originalPrice: 100,
  status: "pending",                    // ← QUEUED: status = PENDING
  settlementStatus: "pending",
  extraInfo: {
    tipMenuItemId: ObjectId("507f1f77bcf86cd799439011"),
    tipMenuId: ObjectId("507f1f77bcf86cd799439010"),
    conversationId: ObjectId("507f1f77bcf86cd799439013"),
    executionMode: "QUEUED"             // ← Marked as queued
  },
  idempotencyKey: "unique-key-queued-001",
  createdAt: ISODate("2026-01-04T07:00:00.000Z"),
  updatedAt: ISODate("2026-01-04T07:00:00.000Z")
}
```

#### QUEUED Mode (After Queue Processing)
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  // ... same fields as above ...
  status: "success",                    // ← Updated by queue processor
  updatedAt: ISODate("2026-01-04T07:00:05.000Z")  // ← Timestamp updated
}
```

---

## Implementation Summary

### Files Modified
1. **`api/src/modules/tip-grid/dtos/purchase-tip-grid-item.dto.ts`**
   - Added `executionMode?: 'IMMEDIATE' | 'QUEUED'` field

2. **`api/src/modules/tip-grid/services/tip-grid.service.ts`**
   - Implemented `OnModuleInit` to register queue processor
   - Split `purchaseTipGridItem` into mode-specific methods:
     - `purchaseTipGridItemImmediate()` - Phase 2 behavior
     - `purchaseTipGridItemQueued()` - Phase 7 behavior
   - Added `processTipGridItemQueued()` completion hook
   - Processor updates status and publishes to settlement channel

3. **`api/src/modules/tip-grid/tip-grid.module.ts`**
   - Added import of `PerformanceQueueModule`

### Key Security Features
- ✅ Idempotency enforcement in both modes
- ✅ Server-side validation (performer, item active, ownership)
- ✅ No client-controlled settlement timing
- ✅ Atomic status updates in queue processor
- ✅ Settlement occurs only after queue completion
- ✅ Audit trail via PurchasedItem and QueueRequest records

---

## Notes for Future Phases

This implementation provides the foundation for:
- **Escrow/Holds**: In future phases, funds could be held (not debited) until queue completion
- **Advanced Scheduling**: Queue can support delayed execution
- **Batch Processing**: Multiple queued items could be settled in batches
- **Cancellation**: Queued items could be cancelled before processing

For now, settlement still occurs synchronously when the queue job completes. True deferred settlement with escrow would be added in a future phase.
