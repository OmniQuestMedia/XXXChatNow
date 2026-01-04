# Tip Grid Manual Test Script

## Purpose
This manual test script validates the idempotency, non-negative balance enforcement, and correct `PurchasedItem` + `Earning` creation for `TIP_GRID_ITEM` transactions.

## Prerequisites
- API server running locally or in test environment
- Access to MongoDB to inspect collections
- At least one performer account with a configured tip menu
- At least one user account with sufficient token balance
- API testing tool (Postman, curl, or similar)

## Test Environment Setup

### 1. Create Test Performer
```bash
# Create a performer with a tip menu
POST /auth/performers/register
{
  "username": "test_performer",
  "email": "performer@test.com",
  "password": "Test123!@#"
}
# Note the performer ID: {performerId}
```

### 2. Create Tip Menu
```bash
# Login as performer
POST /auth/performers/login
{
  "email": "performer@test.com",
  "password": "Test123!@#"
}
# Save token: {performerToken}

# Create tip menu
POST /tip-grid/menu
Headers: Authorization: Bearer {performerToken}
{
  "title": "Test Tip Menu",
  "isActive": true
}

# Create tip menu items
POST /tip-grid/items
Headers: Authorization: Bearer {performerToken}
{
  "label": "Flash",
  "description": "Quick flash",
  "price": 50,
  "position": 1,
  "isActive": true
}
# Note the item ID: {tipMenuItemId}

POST /tip-grid/items
Headers: Authorization: Bearer {performerToken}
{
  "label": "Dance",
  "description": "Sexy dance",
  "price": 100,
  "position": 2,
  "isActive": true
}
# Note the item ID: {tipMenuItemId2}
```

### 3. Create Test User
```bash
# Create user account
POST /auth/users/register
{
  "username": "test_user",
  "email": "user@test.com",
  "password": "Test123!@#"
}
# Note the user ID: {userId}

# Login as user
POST /auth/users/login
{
  "email": "user@test.com",
  "password": "Test123!@#"
}
# Save token: {userToken}

# Add tokens to user balance (admin operation or direct DB update)
# Set user balance to 1000 tokens in MongoDB:
db.users.updateOne(
  { _id: ObjectId("{userId}") },
  { $set: { balance: 1000 } }
)
```

## Test Suite

---

## Test 1: Basic Tip Grid Item Purchase

### Objective
Verify that a basic tip grid item purchase creates the correct `PurchasedItem` with proper fields.

### Steps

1. **Record initial state**
   ```bash
   # Check user balance
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = 1000
   
   # Check performer balance
   GET /performers/{performerId}
   # Expected: balance = 0 (or initial value)
   ```

2. **Purchase tip grid item**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId}",
     "performerId": "{performerId}",
     "conversationId": null
   }
   ```

3. **Verify response**
   - Status: 200 OK
   - Response contains: `transactionId`, `success: true`
   - Note the `transactionId`: {transactionId1}

4. **Verify PurchasedItem in database**
   ```javascript
   db.purchaseditems.findOne({ _id: ObjectId("{transactionId1}") })
   ```
   
   **Expected fields:**
   - `type`: "tip_grid_item"
   - `status`: "pending" (initially, then becomes "success")
   - `settlementStatus`: "pending" (initially, then becomes "settled")
   - `source`: "user"
   - `sourceId`: {userId}
   - `sellerId`: {performerId}
   - `totalPrice`: 50
   - `extraInfo.tipMenuItemId`: {tipMenuItemId}

5. **Wait for settlement (2-3 seconds)**

6. **Verify settlement occurred**
   ```javascript
   // Check PurchasedItem settlement status
   db.purchaseditems.findOne({ _id: ObjectId("{transactionId1}") })
   ```
   
   **Expected:**
   - `status`: "success"
   - `settlementStatus`: "settled"

7. **Verify Earning record created**
   ```javascript
   db.earnings.findOne({ transactionTokenId: ObjectId("{transactionId1}") })
   ```
   
   **Expected fields:**
   - `type`: "tip_grid_item"
   - `userId`: {userId}
   - `performerId`: {performerId}
   - `originalPrice`: 50
   - `grossPrice`: 50
   - `netPrice`: (50 minus commission, e.g., 40 if 20% commission)
   - `commission`: (percentage value, e.g., 20)
   - `transactionStatus`: "success"

8. **Verify balance updates**
   ```bash
   # Check user balance decreased
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = 950 (1000 - 50)
   
   # Check performer balance increased
   GET /performers/{performerId}
   # Expected: balance = 40 (netPrice after commission)
   ```

### Success Criteria
- ✅ PurchasedItem created with type "tip_grid_item" and initial status "pending"
- ✅ Settlement occurs and status becomes "success", settlementStatus becomes "settled"
- ✅ Earning record created with correct type "tip_grid_item"
- ✅ User balance decremented by totalPrice
- ✅ Performer balance incremented by netPrice
- ✅ No duplicate records created

---

## Test 2: Idempotency - Duplicate Request Prevention

### Objective
Verify that using the same `idempotencyKey` prevents duplicate transactions.

### Steps

1. **Record initial state**
   ```bash
   # Check current user balance
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Note current balance: {currentBalance}
   ```

2. **Generate unique idempotency key**
   ```
   idempotencyKey = "test-idempotency-{timestamp}-{random}"
   Example: "test-idempotency-1704360000-abc123"
   ```

3. **First purchase with idempotency key**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId2}",
     "performerId": "{performerId}",
     "conversationId": null,
     "idempotencyKey": "{idempotencyKey}"
   }
   ```
   
   **Expected:**
   - Status: 200 OK
   - Response: `{ success: true, transactionId: "..." }`
   - Note the `transactionId`: {transactionId2}

4. **Immediately retry with same idempotency key**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId2}",
     "performerId": "{performerId}",
     "conversationId": null,
     "idempotencyKey": "{idempotencyKey}"
   }
   ```
   
   **Expected:**
   - Status: 400 Bad Request
   - Error message: "Duplicate request detected. Transaction already processed."

5. **Verify only one PurchasedItem created**
   ```javascript
   db.purchaseditems.find({ 
     sourceId: ObjectId("{userId}"),
     idempotencyKey: "{idempotencyKey}"
   }).count()
   ```
   
   **Expected:** Count = 1

6. **Wait for settlement (2-3 seconds)**

7. **Retry again after settlement**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId2}",
     "performerId": "{performerId}",
     "conversationId": null,
     "idempotencyKey": "{idempotencyKey}"
   }
   ```
   
   **Expected:**
   - Status: 400 Bad Request
   - Error message: "Duplicate request detected. Transaction already processed."

8. **Verify balance only changed once**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = {currentBalance} - 100 (only one deduction)
   ```

9. **Verify only one Earning record**
   ```javascript
   db.earnings.find({ 
     userId: ObjectId("{userId}"),
     transactionTokenId: ObjectId("{transactionId2}")
   }).count()
   ```
   
   **Expected:** Count = 1

### Success Criteria
- ✅ First request with idempotencyKey succeeds
- ✅ Second request with same idempotencyKey fails with 400 Bad Request
- ✅ Third request (after settlement) still fails with same idempotencyKey
- ✅ Only one PurchasedItem record exists with that idempotencyKey
- ✅ Only one Earning record exists
- ✅ User balance only decremented once
- ✅ Performer balance only incremented once

---

## Test 3: Non-Negative Balance Enforcement

### Objective
Verify that the settlement process prevents user balance from going negative.

### Steps

1. **Set user balance to exact amount**
   ```javascript
   // Direct database update to set balance to 50 tokens
   db.users.updateOne(
     { _id: ObjectId("{userId}") },
     { $set: { balance: 50 } }
   )
   ```

2. **Verify balance**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = 50
   ```

3. **Purchase item that costs exactly the balance**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId}",
     "performerId": "{performerId}",
     "conversationId": null,
     "idempotencyKey": "test-exact-balance-{timestamp}"
   }
   ```
   
   **Expected:**
   - Status: 200 OK
   - Transaction created successfully

4. **Wait for settlement (2-3 seconds)**

5. **Verify balance is zero (not negative)**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = 0
   ```

6. **Verify settlement succeeded**
   ```javascript
   db.purchaseditems.findOne({ 
     sourceId: ObjectId("{userId}"),
     idempotencyKey: "test-exact-balance-{timestamp}"
   })
   ```
   
   **Expected:**
   - `settlementStatus`: "settled"
   - `status`: "success"

7. **Set user balance to less than item cost**
   ```javascript
   // Set balance to 30 tokens (less than 50)
   db.users.updateOne(
     { _id: ObjectId("{userId}") },
     { $set: { balance: 30 } }
   )
   ```

8. **Attempt to purchase item that exceeds balance**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId}",
     "performerId": "{performerId}",
     "conversationId": null,
     "idempotencyKey": "test-insufficient-{timestamp}"
   }
   ```
   
   **Expected:**
   - Status: 200 OK (PurchasedItem created initially)
   - Note the `transactionId`: {transactionId3}

9. **Wait for settlement (2-3 seconds)**

10. **Verify settlement failed**
    ```javascript
    db.purchaseditems.findOne({ _id: ObjectId("{transactionId3}") })
    ```
    
    **Expected:**
    - `settlementStatus`: "failed"
    - `status`: "pending" (or "success" depending on implementation)

11. **Verify balance unchanged**
    ```bash
    GET /users/me
    Headers: Authorization: Bearer {userToken}
    # Expected: balance = 30 (unchanged)
    ```

12. **Verify balance is not negative**
    ```javascript
    db.users.findOne({ _id: ObjectId("{userId}") })
    ```
    
    **Expected:**
    - `balance`: >= 0 (must be non-negative)

13. **Verify no Earning created for failed settlement**
    ```javascript
    db.earnings.findOne({ transactionTokenId: ObjectId("{transactionId3}") })
    ```
    
    **Expected:** null (no earning record for failed settlement)

### Success Criteria
- ✅ Transaction with exact balance amount settles successfully
- ✅ Final balance is 0 (not negative)
- ✅ Transaction with insufficient balance fails settlement
- ✅ Balance remains unchanged when settlement fails
- ✅ Balance never goes negative under any circumstance
- ✅ No Earning record created for failed settlements

---

## Test 4: Concurrent Request Handling

### Objective
Verify that multiple concurrent requests with different idempotency keys do not create race conditions leading to negative balances.

### Steps

1. **Set user balance**
   ```javascript
   // Set balance to 150 tokens
   db.users.updateOne(
     { _id: ObjectId("{userId}") },
     { $set: { balance: 150 } }
   )
   ```

2. **Verify initial balance**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = 150
   ```

3. **Prepare concurrent requests**
   - Request A: Purchase item costing 100 tokens
   - Request B: Purchase item costing 100 tokens
   - Total cost: 200 tokens (exceeds balance of 150)

4. **Execute requests simultaneously**
   ```bash
   # Terminal 1
   curl -X POST http://localhost:8080/tip-grid/purchase \
     -H "Authorization: Bearer {userToken}" \
     -H "Content-Type: application/json" \
     -d '{
       "tipMenuItemId": "{tipMenuItemId2}",
       "performerId": "{performerId}",
       "idempotencyKey": "concurrent-a-{timestamp}"
     }'
   
   # Terminal 2 (execute immediately)
   curl -X POST http://localhost:8080/tip-grid/purchase \
     -H "Authorization: Bearer {userToken}" \
     -H "Content-Type: application/json" \
     -d '{
       "tipMenuItemId": "{tipMenuItemId2}",
       "performerId": "{performerId}",
       "idempotencyKey": "concurrent-b-{timestamp}"
     }'
   ```
   
   **Expected:**
   - Both requests return 200 OK initially
   - Both create PurchasedItem records

5. **Wait for settlement (5 seconds to allow both to process)**

6. **Check final balance**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   ```
   
   **Expected:**
   - Balance: 50 (150 - 100 = 50) if one succeeded
   - OR Balance: 150 if both failed
   - **MUST NOT be negative**

7. **Verify settlement statuses**
   ```javascript
   db.purchaseditems.find({ 
     sourceId: ObjectId("{userId}"),
     idempotencyKey: /concurrent-(a|b)-/
   }).sort({ createdAt: 1 })
   ```
   
   **Expected:**
   - One transaction: `settlementStatus: "settled"`, `status: "success"`
   - One transaction: `settlementStatus: "failed"`
   - Total debited: exactly 100 tokens (for the one that succeeded)

8. **Verify Earning records**
   ```javascript
   db.earnings.find({ 
     userId: ObjectId("{userId}"),
     createdAt: { $gte: new Date(Date.now() - 60000) }
   }).count()
   ```
   
   **Expected:** Count = 1 (only for the settled transaction)

### Success Criteria
- ✅ Both requests accepted initially (return 200)
- ✅ Only one settlement succeeds (the first to acquire lock)
- ✅ One settlement fails due to insufficient balance
- ✅ Final balance is non-negative
- ✅ Total debit matches exactly one transaction amount
- ✅ Only one Earning record created
- ✅ No data corruption or inconsistencies

---

## Test 5: Settlement Idempotency (Double Event Processing)

### Objective
Verify that if the settlement event is processed twice (due to queue retries), it does not double debit/credit.

### Steps

1. **Set user balance**
   ```javascript
   db.users.updateOne(
     { _id: ObjectId("{userId}") },
     { $set: { balance: 200 } }
   )
   ```

2. **Create a purchase**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId}",
     "performerId": "{performerId}",
     "idempotencyKey": "settlement-idempotency-{timestamp}"
   }
   ```
   
   **Expected:**
   - Status: 200 OK
   - Note the `transactionId`: {transactionId4}

3. **Wait for settlement (2-3 seconds)**

4. **Verify first settlement**
   ```javascript
   const purchasedItem = db.purchaseditems.findOne({ 
     _id: ObjectId("{transactionId4}") 
   });
   console.log(purchasedItem.settlementStatus); // "settled"
   ```

5. **Record balance after first settlement**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = 150 (200 - 50)
   # Note: {balanceAfterFirstSettlement}
   ```

6. **Simulate duplicate event processing**
   ```javascript
   // This simulates what would happen if the event queue redelivered the message
   // In a real test, you would:
   // 1. Pause the settlement listener
   // 2. Publish the event twice
   // 3. Resume the listener
   // 
   // For manual testing, observe logs and verify settlement status checks prevent double processing
   
   // Check the code ensures settlementStatus gate in PaymentTokenListener:
   // - Line ~115: if (purchasedItem.settlementStatus === SETTLEMENT_STATUS.SETTLED) { return; }
   ```

7. **Verify balance unchanged after hypothetical retry**
   ```bash
   GET /users/me
   Headers: Authorization: Bearer {userToken}
   # Expected: balance = {balanceAfterFirstSettlement} (unchanged)
   ```

8. **Verify only one Earning record**
   ```javascript
   db.earnings.find({ 
     transactionTokenId: ObjectId("{transactionId4}") 
   }).count()
   ```
   
   **Expected:** Count = 1

9. **Verify settlement status remains settled**
   ```javascript
   db.purchaseditems.findOne({ _id: ObjectId("{transactionId4}") })
   ```
   
   **Expected:**
   - `settlementStatus`: "settled" (unchanged)

### Success Criteria
- ✅ First settlement processes successfully
- ✅ Hypothetical duplicate event processing is prevented by settlementStatus gate
- ✅ Balance only decremented once
- ✅ Performer balance only incremented once
- ✅ Only one Earning record created
- ✅ settlementStatus remains "settled" and is not changed by retry

---

## Test 6: PurchasedItem and Earning Field Validation

### Objective
Verify all critical fields are correctly populated in both `PurchasedItem` and `Earning` records.

### Steps

1. **Create a purchase with all optional fields**
   ```bash
   POST /tip-grid/purchase
   Headers: Authorization: Bearer {userToken}
   {
     "tipMenuItemId": "{tipMenuItemId}",
     "performerId": "{performerId}",
     "conversationId": "{conversationId}",
     "idempotencyKey": "field-validation-{timestamp}"
   }
   ```
   
   **Expected:**
   - Status: 200 OK
   - Note the `transactionId`: {transactionId5}

2. **Wait for settlement (2-3 seconds)**

3. **Verify PurchasedItem fields**
   ```javascript
   const item = db.purchaseditems.findOne({ _id: ObjectId("{transactionId5}") });
   
   // Required fields
   assert(item.type === "tip_grid_item", "type must be tip_grid_item");
   assert(item.status === "success", "status must be success");
   assert(item.settlementStatus === "settled", "settlementStatus must be settled");
   assert(item.source === "user", "source must be user");
   assert(item.sourceId.equals(ObjectId("{userId}")), "sourceId must match user");
   assert(item.sellerId.equals(ObjectId("{performerId}")), "sellerId must match performer");
   assert(item.totalPrice === 50, "totalPrice must be 50");
   assert(item.price === 50, "price must be 50");
   assert(item.quantity === 1, "quantity must be 1");
   assert(item.idempotencyKey === "field-validation-{timestamp}", "idempotencyKey must match");
   
   // ExtraInfo
   assert(item.extraInfo.tipMenuItemId.equals(ObjectId("{tipMenuItemId}")), "extraInfo must contain tipMenuItemId");
   assert(item.extraInfo.conversationId.equals(ObjectId("{conversationId}")), "extraInfo must contain conversationId");
   
   // Timestamps
   assert(item.createdAt instanceof Date, "createdAt must be a Date");
   assert(item.updatedAt instanceof Date, "updatedAt must be a Date");
   ```

4. **Verify Earning fields**
   ```javascript
   const earning = db.earnings.findOne({ transactionTokenId: ObjectId("{transactionId5}") });
   
   // Required fields
   assert(earning.type === "tip_grid_item", "type must be tip_grid_item");
   assert(earning.userId.equals(ObjectId("{userId}")), "userId must match");
   assert(earning.performerId.equals(ObjectId("{performerId}")), "performerId must match");
   assert(earning.transactionTokenId.equals(ObjectId("{transactionId5}")), "transactionTokenId must match");
   assert(earning.transactionStatus === "success", "transactionStatus must be success");
   assert(earning.source === "user", "source must be user");
   assert(earning.target === "performer", "target must be performer");
   assert(earning.sourceId.equals(ObjectId("{userId}")), "sourceId must match");
   assert(earning.targetId.equals(ObjectId("{performerId}")), "targetId must match");
   
   // Financial fields
   assert(earning.originalPrice === 50, "originalPrice must be 50");
   assert(earning.grossPrice === 50, "grossPrice must be 50");
   assert(typeof earning.commission === "number", "commission must be a number");
   assert(earning.commission >= 0 && earning.commission <= 100, "commission must be 0-100");
   assert(earning.netPrice > 0, "netPrice must be positive");
   assert(earning.netPrice === 50 - (50 * earning.commission / 100), "netPrice calculation must be correct");
   
   // Payment status
   assert(earning.isPaid === false, "isPaid must be false initially");
   assert(earning.payoutStatus === "pending", "payoutStatus must be pending");
   
   // Timestamps
   assert(earning.createdAt instanceof Date, "createdAt must be a Date");
   assert(earning.updatedAt instanceof Date, "updatedAt must be a Date");
   ```

### Success Criteria
- ✅ All required PurchasedItem fields are populated correctly
- ✅ All required Earning fields are populated correctly
- ✅ Financial calculations (netPrice = grossPrice - commission) are correct
- ✅ Timestamps are set properly
- ✅ Foreign key references (IDs) match correctly
- ✅ Extra info contains tipMenuItemId and conversationId

---

## Test Execution Summary Template

After running all tests, document results:

```
Test Suite: Tip Grid Manual Tests
Date: [DATE]
Tester: [NAME]
Environment: [ENVIRONMENT]

Test Results:
- Test 1 (Basic Purchase): [PASS/FAIL]
- Test 2 (Idempotency): [PASS/FAIL]
- Test 3 (Non-Negative Balance): [PASS/FAIL]
- Test 4 (Concurrent Requests): [PASS/FAIL]
- Test 5 (Settlement Idempotency): [PASS/FAIL]
- Test 6 (Field Validation): [PASS/FAIL]

Critical Issues Found:
[List any issues]

Non-Critical Issues Found:
[List any issues]

Recommendations:
[Any recommendations for improvements]
```

---

## Troubleshooting

### Issue: Settlement not occurring
- **Check:** Event queue is running and connected
- **Check:** MongoDB connection is active
- **Check:** Look at application logs for errors
- **Action:** Verify `PURCHASED_ITEM_SUCCESS_CHANNEL` listener is subscribed

### Issue: Balance going negative
- **Critical:** This is a critical security issue
- **Action:** Immediately check settlement logic for conditional update: `{ balance: { $gte: amount } }`
- **Action:** Verify database-level balance validation

### Issue: Duplicate PurchasedItems created
- **Check:** Verify unique index on `(sourceId, idempotencyKey)`
- **Action:** Check for index: `db.purchaseditems.getIndexes()`
- **Action:** Verify idempotencyKey is being provided and stored

### Issue: Multiple Earnings for same transaction
- **Check:** Settlement idempotency gate at line ~115 of PaymentTokenListener
- **Action:** Verify settlementStatus is checked before creating Earning

---

## Notes
- All tests should be run in a test environment, not production
- Database should be backed up before manual testing
- Use unique idempotency keys for each test run
- Monitor application logs during testing for error messages
- Allow sufficient time (2-5 seconds) for asynchronous settlement
