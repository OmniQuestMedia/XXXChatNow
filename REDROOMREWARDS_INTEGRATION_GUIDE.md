# RedRoomRewards Integration Guide for XXXChatNow

This guide provides step-by-step instructions for integrating the RedRoomRewards loyalty points system with XXXChatNow's existing payment and token flows.

## Prerequisites

1. **RRR API Credentials**: Obtain from RedRoomRewards team
   - Client ID
   - Client Secret
   - Webhook Secret
   - API Base URL (production/staging)

2. **Environment Configuration**: Add to `.env` file:
   ```bash
   RRR_API_BASE_URL=https://api.redroomrewards.com
   RRR_CLIENT_ID=your_client_id
   RRR_CLIENT_SECRET=your_client_secret
   RRR_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Database Migration**: Run to create RRR account link collection:
   ```bash
   # Collection will be auto-created by Mongoose on first use
   # Indexes will be created automatically
   ```

## Integration Points

### 1. User Profile Enhancement

**Location**: `api/src/modules/user/`

**Changes Needed**:
- Add RRR link status to user profile response
- Add loyalty points balance display in user dashboard

**Example Implementation**:

```typescript
// In user.service.ts
import { RRRAccountLinkService, RRRPointsService } from '../loyalty-points';

@Injectable()
export class UserService {
  constructor(
    // ... existing dependencies
    private readonly rrrAccountLinkService: RRRAccountLinkService,
    private readonly rrrPointsService: RRRPointsService
  ) {}

  async getUserProfile(userId: ObjectId) {
    const user = await this.userModel.findById(userId);
    
    // Get RRR link status
    const rrrLinkStatus = await this.rrrAccountLinkService.getLinkStatus(userId);
    
    // Get points balance if linked
    let loyaltyPoints = null;
    if (rrrLinkStatus.linked) {
      loyaltyPoints = await this.rrrPointsService.getUserWallet(userId);
    }

    return {
      ...user.toObject(),
      rrr_link_status: rrrLinkStatus,
      loyalty_points: loyaltyPoints
    };
  }
}
```

### 2. Token Purchase Flow Enhancement

**Location**: `api/src/modules/payment/services/payment.service.ts`

**Changes Needed**:
- Post earn event to RRR after successful token purchase
- Use idempotency key from order ID to prevent duplicate points

**Example Implementation**:

```typescript
// In payment.service.ts
import { RRRPointsService } from '../../loyalty-points';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    // ... existing dependencies
    private readonly rrrPointsService: RRRPointsService
  ) {}

  async handleSuccessfulTokenPurchase(
    userId: ObjectId,
    orderId: string,
    currency: string,
    amountMinor: number,
    tokensPurchased: number
  ) {
    // Existing logic to credit tokens...

    // Calculate loyalty points (e.g., 1 point per $1 spent)
    const pointsToEarn = Math.floor(amountMinor / 100);

    try {
      // Post earn event to RRR
      // Use order ID as idempotency key to prevent duplicate points
      const idempotencyKey = `token_purchase_${orderId}`;
      
      await this.rrrPointsService.earnFromTokenPurchase(
        userId,
        orderId,
        currency,
        amountMinor,
        pointsToEarn,
        idempotencyKey,
        {
          tokens_purchased: tokensPurchased,
          source: 'token_package_purchase'
        }
      );
      
      this.logger.log(`Posted ${pointsToEarn} points earn event for order ${orderId}`);
    } catch (error) {
      // Log but don't fail the purchase if RRR is down
      this.logger.error(`Failed to post earn event to RRR: ${error.message}`);
    }
  }
}
```

### 3. Membership Purchase Flow Enhancement

**Location**: `api/src/modules/payment/services/payment.service.ts`

**Changes Needed**:
- Post earn event for membership purchases
- Include membership tier in metadata

**Example Implementation**:

```typescript
async handleSuccessfulMembershipPurchase(
  userId: ObjectId,
  orderId: string,
  currency: string,
  amountMinor: number,
  membershipTier: string
) {
  // Existing membership activation logic...

  // Calculate loyalty points (e.g., 2x multiplier for memberships)
  const pointsToEarn = Math.floor(amountMinor / 100) * 2;

  try {
    const idempotencyKey = `membership_purchase_${orderId}`;
    
    await this.rrrPointsService.earnFromMembershipPurchase(
      userId,
      orderId,
      currency,
      amountMinor,
      pointsToEarn,
      idempotencyKey,
      membershipTier
    );
    
    this.logger.log(`Posted ${pointsToEarn} points earn event for membership order ${orderId}`);
  } catch (error) {
    this.logger.error(`Failed to post membership earn event to RRR: ${error.message}`);
  }
}
```

### 4. Checkout Flow with Points Redemption

**Location**: `api/src/modules/payment/controllers/payment.controller.ts`

**Changes Needed**:
- Add redemption quote endpoint before checkout
- Apply points discount at checkout
- Commit redemption after payment success
- Reverse redemption if payment fails

**Example Implementation**:

```typescript
// New endpoint for getting redemption quote
@Post('quote-redemption')
@UseGuards(AuthGuard)
async quoteRedemption(
  @Request() req,
  @Body() dto: { cart_total_minor: number; currency: string; points: number }
) {
  return this.rrrPointsService.quoteRedemption(
    req.user._id,
    dto.cart_total_minor,
    dto.currency,
    RRRRedemptionMode.EXACT,
    dto.points
  );
}

// Modified checkout endpoint
@Post('checkout')
@UseGuards(AuthGuard)
async checkout(
  @Request() req,
  @Body() dto: CheckoutDto
) {
  let redemptionQuoteId = null;
  let pointsDiscount = 0;

  // If user wants to redeem points
  if (dto.use_points && dto.points_to_redeem) {
    const quote = await this.rrrPointsService.quoteRedemption(
      req.user._id,
      dto.total_minor,
      dto.currency,
      RRRRedemptionMode.EXACT,
      dto.points_to_redeem
    );

    if (quote.eligible) {
      redemptionQuoteId = quote.quote_id;
      pointsDiscount = quote.quote.discount_minor;
    }
  }

  // Calculate final amount after points discount
  const finalAmountMinor = dto.total_minor - pointsDiscount;

  try {
    // Process payment with payment gateway
    const paymentResult = await this.processPayment(finalAmountMinor, dto.currency);

    // If payment successful and points were redeemed, commit redemption
    if (paymentResult.success && redemptionQuoteId) {
      const idempotencyKey = `redemption_${paymentResult.orderId}`;
      await this.rrrPointsService.commitRedemption(
        req.user._id,
        redemptionQuoteId,
        paymentResult.orderId,
        idempotencyKey
      );
    }

    return {
      success: true,
      order_id: paymentResult.orderId,
      points_redeemed: dto.points_to_redeem || 0,
      discount_applied: pointsDiscount
    };
  } catch (error) {
    // If payment failed and we had redeemed points, reverse the redemption
    if (redemptionQuoteId) {
      try {
        const idempotencyKey = `redemption_reverse_${paymentResult.orderId}`;
        await this.rrrPointsService.reverseRedemption(
          paymentResult.orderId,
          'PAYMENT_FAILED',
          idempotencyKey
        );
      } catch (reverseError) {
        this.logger.error(`Failed to reverse redemption: ${reverseError.message}`);
      }
    }
    throw error;
  }
}
```

### 5. Webhook Event Handling

**Location**: `api/src/modules/loyalty-points/controllers/rrr-webhook.controller.ts`

**Implementation Status**: Basic webhook receiver is implemented with signature verification. Event handlers are stubs that need to be implemented based on business requirements.

**Example Enhancement**:

```typescript
private async handlePointsPosted(data: any): Promise<void> {
  // Update local cache/stats
  const { member_id, points_delta, ledger_entry_id } = data;
  
  // Optionally notify user
  await this.notificationService.notify(member_id, {
    type: 'points_earned',
    points: points_delta,
    entry_id: ledger_entry_id
  });
  
  this.logger.log(`Points posted: ${points_delta} for member ${member_id}`);
}
```

## Security Checklist

- [x] OAuth 2.0 client credentials flow implemented
- [x] Idempotency keys used for all mutations
- [x] Webhook signature verification implemented
- [x] No PII logged in financial operations
- [x] All errors handled gracefully without exposing sensitive data
- [x] Rate limiting considerations documented
- [x] HTTPS required for all RRR API communication

## Testing Checklist

### Unit Tests
- [x] RRRApiClientService - OAuth flow, API calls
- [x] RRRAccountLinkService - Link creation, status checks
- [ ] RRRPointsService - Earn, redeem, reversal flows
- [ ] Webhook signature verification

### Integration Tests
- [ ] End-to-end account linking flow
- [ ] Token purchase with points earning
- [ ] Checkout with points redemption
- [ ] Redemption reversal on payment failure
- [ ] Webhook event processing

### Manual Testing
- [ ] Link RRR account from user profile
- [ ] Purchase tokens and verify points earned
- [ ] Redeem points at checkout
- [ ] View points balance in user dashboard
- [ ] Test with RRR staging environment

## Monitoring and Observability

### Recommended Metrics
- Points earn event success/failure rate
- Redemption success/failure rate
- Average redemption amount
- Webhook processing latency
- RRR API response times
- OAuth token refresh rate

### Logging
All RRR operations are logged with:
- Operation type (earn, redeem, etc.)
- Request trace ID
- Success/failure status
- Error messages (sanitized, no PII)

### Alerts
Consider setting up alerts for:
- RRR API availability < 99%
- Earn event failure rate > 5%
- Redemption reversal rate > 10%
- Webhook signature verification failures

## Rollout Strategy

### Phase 1: Soft Launch (Limited Users)
1. Deploy loyalty points module to staging
2. Test with internal users
3. Enable for beta user cohort
4. Monitor for issues

### Phase 2: Gradual Rollout
1. Enable for 10% of users
2. Monitor metrics for 48 hours
3. Increase to 50% if stable
4. Monitor for another 48 hours
5. Enable for all users

### Phase 3: Feature Enhancement
1. Add promotional campaigns
2. Implement model-to-viewer point awards
3. Add points transfer features
4. Implement tier-based multipliers

## Rollback Plan

If critical issues are discovered:

1. **Disable New Earn Events**:
   ```typescript
   // Add feature flag check
   if (!this.configService.get('rrr.earnEnabled')) {
     this.logger.warn('RRR earn disabled by feature flag');
     return;
   }
   ```

2. **Disable Redemption**:
   ```typescript
   // Add feature flag check
   if (!this.configService.get('rrr.redeemEnabled')) {
     throw new BadRequestException('Points redemption temporarily unavailable');
   }
   ```

3. **Graceful Degradation**: Application continues to work normally without loyalty points features.

## Support and Resources

- **RRR API Documentation**: See `/REDROOMREWARDS_API_CONTRACT_v1.md`
- **Module README**: See `/api/src/modules/loyalty-points/README.md`
- **RRR Support**: Contact RedRoomRewards team
- **Internal Support**: See main project documentation

## Appendix: Configuration Reference

### Environment Variables
```bash
# Required
RRR_API_BASE_URL=https://api.redroomrewards.com
RRR_CLIENT_ID=your_client_id
RRR_CLIENT_SECRET=your_client_secret
RRR_WEBHOOK_SECRET=your_webhook_secret

# Optional (feature flags)
RRR_EARN_ENABLED=true
RRR_REDEEM_ENABLED=true
RRR_LINK_ENABLED=true
```

### Points Calculation Examples
```typescript
// Token purchases: 1 point per $1 spent
const points = Math.floor(amountMinor / 100);

// Membership purchases: 2x multiplier
const points = Math.floor(amountMinor / 100) * 2;

// VIP tier: 1.5x multiplier
const multiplier = userTier === 'VIP' ? 1.5 : 1.0;
const points = Math.floor(amountMinor / 100 * multiplier);
```

### Redemption Value
```typescript
// 1 point = $0.01 discount (100:1 ratio)
const discountMinor = pointsToRedeem * 1;

// 1 point = $0.02 discount (50:1 ratio)
const discountMinor = pointsToRedeem * 2;
```

Note: Actual conversion rates are configured in RRR and returned in redemption quotes.
