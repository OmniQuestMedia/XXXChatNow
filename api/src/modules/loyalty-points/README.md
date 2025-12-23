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
3. XCN posts earn event to RRR via API
4. RRR records the points in its ledger
5. RRR sends webhook confirmation back to XCN

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

### Webhooks
- `POST /loyalty-points/webhooks` - RRR webhook receiver

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
All mutating operations (POST/PATCH/DELETE) require an idempotency key to prevent duplicate transactions. The system automatically generates UUIDs for these keys.

### Authentication
- Service-to-service calls use OAuth 2.0 client credentials flow
- Access tokens are cached and automatically refreshed
- All API calls include client ID and request trace headers

### PII Protection
- No personally identifiable information (PII) is logged for financial operations
- Audit trails use member IDs, not names or emails
- Webhook handlers validate signatures before processing

### Rate Limiting
- RRR enforces 100 rps baseline, 200 rps burst
- Client handles 429 responses with exponential backoff

## Integration Points

### Payment Module
The payment module should be updated to:
1. Post earn events after successful token/membership purchases
2. Quote redemption during checkout
3. Commit redemption after payment success
4. Reverse redemption if payment fails

### User Module
User profiles can display:
- Current points balance
- Expiring points alerts
- Link status with RRR

## Testing

Unit tests are provided for:
- API client service
- Account linking service
- Points earning and redemption

Integration tests verify:
- OAuth authentication flow
- Idempotency key handling
- Webhook signature verification
- Error handling

## Contract Document

Full API contract is available at: `/REDROOMREWARDS_API_CONTRACT_v1.md`

## Support

For RRR API issues or questions, contact RedRoomRewards support.
For XCN integration issues, see the main repository documentation.
