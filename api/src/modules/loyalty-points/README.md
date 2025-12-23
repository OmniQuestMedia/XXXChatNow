# Loyalty Points Module - RedRoomRewards Integration

This module implements the integration with RedRoomRewards (RRR), the external loyalty points platform for XXXChatNow.

## Overview

RedRoomRewards (RRR) is a separate system that manages:
- Loyalty points issuance and redemption
- Points balance and expiry tracking
- Promotion campaigns and approvals
- Complete audit trail for all points transactions

XXXChatNow remains the system of record for:
- Cash payments and refunds
- Token purchases and spending
- User accounts and authentication

## Architecture

### Account Linking
Users must link their XCN account with their RRR account before earning or redeeming points:
1. User initiates link intent from XCN
2. RRR provides a link code
3. User enters code in RRR to confirm link
4. Both systems store the bidirectional mapping

**Important**: One-to-one mapping is enforced. Each XCN user can only link to one RRR account and vice versa.

### Points Earning Flow
1. User purchases tokens or membership in XCN
2. Payment completes successfully in XCN
3. XCN **automatically** posts earn event to RRR via payment listener
4. RRR records the points in its ledger
5. RRR sends webhook confirmation back to XCN

**Earn Rates:**
- Token purchases: 1 point per $1 spent
- Membership purchases: 2 points per $1 spent (2x multiplier)

### Points Redemption Flow
1. User initiates checkout in XCN
2. XCN requests redemption quote from RRR
3. RRR returns max/min points and discount amount
4. User confirms order
5. XCN commits redemption (atomic points burn)
6. If payment fails, XCN reverses redemption

### Webhooks
RRR sends webhooks to XCN for:
- Points posted confirmation
- Points reversed (e.g., chargebacks)
- Redemption confirmations
- Link status changes
- Promotion updates

## API Endpoints

### Account Linking
- `POST /loyalty-points/links/intents` - Create link intent
- `POST /loyalty-points/links/confirm` - Confirm link
- `GET /loyalty-points/links/status` - Get link status
- `POST /loyalty-points/links/revoke` - Revoke link

### Wallet & Balance
- `GET /loyalty-points/wallet` - Get user's points balance
- `POST /loyalty-points/wallet/quote-redemption` - Quote redemption
- `POST /loyalty-points/wallet/quote-topup` - Quote points top-up purchase

### Model-to-Viewer Awards
- `POST /loyalty-points/awards/intents` - Create award intent (model awarding points to viewer)
- `POST /loyalty-points/awards/commit` - Commit award

**Note:** Awards are blocked if viewer is not linked to RRR. The response includes a helpful message.

### Promotions (Admin Only)
- `POST /loyalty-points/promotions` - Create promotion
- `PATCH /loyalty-points/promotions/:id` - Update promotion
- `POST /loyalty-points/promotions/:id/submit` - Submit for approval
- `POST /loyalty-points/promotions/:id/approve` - Approve promotion (multi-sig required)
- `GET /loyalty-points/promotions/:id` - Get promotion details
- `GET /loyalty-points/promotions` - List promotions

**Multi-Sig Approval:** Requires 2 distinct XCN admins + 1 RRR admin to approve. Single admin cannot approve twice.

### Manual Adjustments (Admin Only)
- `POST /loyalty-points/adjustments` - Create manual points adjustment

**Thresholds:**
- ≤100 points: 1 XCN admin
- 101-500 points: 2 XCN admins
- >500 points: 2 XCN admins + 1 RRR admin

### Webhooks
- `POST /loyalty-points/webhooks` - RRR webhook receiver (with HMAC signature verification)

## Configuration

Add to your `.env` file:

```bash
RRR_API_BASE_URL=https://api.redroomrewards.com
RRR_CLIENT_ID=your_client_id_here
RRR_CLIENT_SECRET=your_client_secret_here
RRR_WEBHOOK_SECRET=your_webhook_secret_here
```

## Security Considerations

### Idempotency
All mutating operations (POST/PATCH/DELETE) require an idempotency key to prevent duplicate transactions. The system automatically generates UUIDs for these keys using the order number for purchases.

### Authentication
- Service-to-service calls use OAuth 2.0 client credentials flow
- Access tokens are cached and automatically refreshed
- All API calls include required headers:
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <uuid>` (for mutations)
  - `X-Client-Id: <client_id>`
  - `X-Request-Trace: <uuid>`

### PII Protection
- No personally identifiable information (PII) is logged for financial operations
- Audit trails use member IDs, not names or emails
- Webhook handlers validate HMAC signatures before processing
- Idempotency tracking ensures webhooks are processed exactly once

### Rate Limiting
- RRR enforces 100 rps baseline, 200 rps burst
- Client handles 429 responses with exponential backoff

## Integration Points

### Payment Module ✅ INTEGRATED
The payment module automatically posts earn events via `PostRRREarnEventFromOrderSuccessListener`:
- Listens to `ORDER_PAID_SUCCESS_CHANNEL` events
- Posts earn events for token purchases (1 point per $1)
- Posts earn events for membership purchases (2 points per $1)
- Handles errors gracefully (doesn't fail order processing if RRR is down)
- Uses order number for idempotency to prevent duplicate points

### User Module ✅ INTEGRATED
User profile (`GET /users/me`) now includes RRR data:
```json
{
  // ... existing user fields
  "rrr": {
    "linked": true,
    "link_type": "MEMBER",
    "linked_at": "2025-12-23T...",
    "wallet": {
      "available_points": 1250,
      "pending_points": 300,
      "escrow_points": 0,
      "expiring_soon": [
        { "points": 200, "expires_at": "2026-01-15T..." }
      ]
    }
  }
}
```

**Graceful Degradation:** If RRR is unavailable, returns:
```json
{
  "rrr": {
    "linked": false,
    "available": false,
    "error": "RedRoomRewards temporarily unavailable"
  }
}
```

### Checkout Module ⏸️ PENDING INTEGRATION
To integrate redemption at checkout:

1. **Before Payment Gateway:**
```typescript
// Get redemption quote
const quote = await rrrPointsService.quoteRedemption(
  userId,
  cartTotalMinor,
  currency,
  RRRRedemptionMode.EXACT,
  requestedPoints
);

// Calculate final amount after discount
const finalAmountMinor = cartTotalMinor - quote.quote.discount_minor;
```

2. **After Payment Success:**
```typescript
if (quote && quote.eligible) {
  const idempotencyKey = `redemption_${orderId}`;
  await rrrPointsService.commitRedemption(
    userId,
    quote.quote_id,
    orderId,
    idempotencyKey
  );
}
```

3. **On Payment Failure:**
```typescript
if (quote && paymentFailed) {
  const idempotencyKey = `redemption_reverse_${orderId}`;
  await rrrPointsService.reverseRedemption(
    orderId,
    RRRReversalReason.PAYMENT_FAILED,
    idempotencyKey
  );
}
```

### Top-Up Flow ⏸️ PENDING INTEGRATION
When user is short of points:

1. **Get Top-Up Quote:**
```typescript
const topupQuote = await rrrPointsService.quoteTopUp(
  250, // bundle size (100, 250, 500 typical)
  3    // unit price in cents (default 3 = $0.03 per point)
);
```

2. **Process Payment in XCN:**
```typescript
const payment = await processPayment(topupQuote.total_cost_minor);
```

3. **Commit Top-Up:**
```typescript
if (payment.success) {
  const idempotencyKey = `topup_${orderId}`;
  await rrrPointsService.commitTopUp(
    userId,
    topupQuote.topup_quote_id,
    orderId,
    idempotencyKey
  );
}
```

## Testing

### Unit Tests
- [x] RRRApiClientService - OAuth flow, API calls
- [x] RRRAccountLinkService - Link creation, status checks
- [ ] RRRPointsService - Earn, redeem, reversal flows
- [ ] Webhook signature verification
- [ ] Idempotency replay tests

### Integration Tests
- [ ] End-to-end account linking flow
- [ ] Token purchase with automatic points earning
- [ ] Checkout with points redemption
- [ ] Redemption reversal on payment failure
- [ ] Webhook event processing with idempotency
- [ ] Model-to-viewer award flow
- [ ] Promotion multi-sig approval flow

### Manual Testing
- [ ] Link RRR account from user profile
- [ ] Purchase tokens and verify points earned in user profile
- [ ] Redeem points at checkout
- [ ] View points balance in user dashboard
- [ ] Test with RRR staging environment
- [ ] Test graceful degradation when RRR is down
- [ ] Test model awarding points to viewer
- [ ] Test admin creating and approving promotions

## Monitoring and Observability

### Recommended Metrics
- Points earn event success/failure rate
- Redemption success/failure rate
- Average redemption amount
- Webhook processing latency
- RRR API response times
- OAuth token refresh rate
- Link conversion rate

### Logging
All RRR operations are logged with:
- Operation type (earn, redeem, award, etc.)
- Request trace ID
- Success/failure status
- Error messages (sanitized, no PII)

Example log:
```
Posted 20 points earn event for token order TP1735050123456
```

### Alerts
Consider setting up alerts for:
- RRR API availability < 99%
- Earn event failure rate > 5%
- Redemption reversal rate > 10%
- Webhook signature verification failures
- Idempotency key conflicts

## Rollout Strategy

### Phase 1: Soft Launch (Current)
1. ✅ Backend APIs deployed
2. ✅ Automatic earn events enabled
3. ⏸️ Frontend integration pending
4. ⏸️ Redemption at checkout pending

### Phase 2: Limited Rollout
1. Enable for beta user cohort (10%)
2. Monitor metrics for 48 hours
3. Gather user feedback
4. Fix any issues

### Phase 3: Full Rollout
1. Enable for 50% of users
2. Monitor for another 48 hours
3. Enable for all users
4. Monitor ongoing metrics

### Rollback Plan

If critical issues are discovered:

1. **Disable Earn Events:**
   - Remove `PostRRREarnEventFromOrderSuccessListener` from payment module
   - Or add feature flag to skip RRR calls

2. **Disable Redemption:**
   - Add feature flag to hide redemption option at checkout
   - Existing balances remain safe in RRR

3. **Graceful Degradation:** 
   - Application continues to work normally
   - Points features simply unavailable

## Support and Resources

- **RRR API Contract**: `/REDROOMREWARDS_XXXCHATNOW_API_CONTRACT_v1.md`
- **Integration Guide**: `/REDROOMREWARDS_INTEGRATION_GUIDE.md`
- **Master Briefing**: `/MASTER_TRANSITION_AND_INTEGRATION_BRIEFING.md`

## Appendix: Configuration Reference

### Environment Variables
```bash
# Required
RRR_API_BASE_URL=https://api.redroomrewards.com
RRR_CLIENT_ID=your_client_id_here
RRR_CLIENT_SECRET=your_client_secret_here
RRR_WEBHOOK_SECRET=your_webhook_secret_here

# Optional (feature flags - not yet implemented)
RRR_EARN_ENABLED=true
RRR_REDEEM_ENABLED=true
RRR_LINK_ENABLED=true
```

### Points Calculation Examples
```typescript
// Token purchases: 1 point per $1 spent
const amountMinor = 1999; // $19.99
const points = Math.floor(amountMinor / 100); // 19 points

// Membership purchases: 2x multiplier
const points = Math.floor(amountMinor / 100) * 2; // 38 points
```

### Redemption Value
```typescript
// Configured in RRR, typically:
// 1 point = $0.01 discount (100:1 ratio)
const discountMinor = pointsToRedeem * 1;
```

## Recent Changes

### 2025-12-23: Payment & Profile Integration
- ✅ Added automatic earn event posting via payment listener
- ✅ Enhanced user profile endpoint with RRR points display
- ✅ Added graceful degradation for RRR unavailability
- ✅ Added model-to-viewer award endpoints
- ✅ Added promotions management with multi-sig approval
- ✅ Added manual adjustments with threshold-based approval
- ✅ Enhanced webhook handler with idempotency tracking

### Previous: Initial Implementation (PR #76)
- ✅ Core RRR API client with OAuth 2.0
- ✅ Account linking endpoints
- ✅ Points earning and redemption services
- ✅ Basic webhook receiver with signature verification

---

**Note**: This integration follows the principle of correctness first, auditability second, speed third. All operations are idempotent, traceable, and PII-safe.
