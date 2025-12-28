# Wallet Module

## Overview

The Wallet Module provides credit balance management and wallet verification capabilities for XXXChatNow users. It establishes protocols for tracking user credit balances and implementing wallet verification status as a user category.

## Features

- **Balance Retrieval**: Get user credit balance with verification status
- **Wallet Verification**: Mark user wallets as verified with timestamp tracking
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Audit Trail**: Complete logging of all verification attempts
- **Security**: Authentication guards on all endpoints

## API Endpoints

### GET /wallet/balance

Get the authenticated user's wallet balance with verification status.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "balance": 100.50,
  "walletVerified": true,
  "walletVerifiedAt": "2025-12-28T03:00:00.000Z",
  "currency": "USD"
}
```

### GET /wallet/verification-status

Check the wallet verification status for the authenticated user.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "verified": true,
  "verifiedAt": "2025-12-28T03:00:00.000Z"
}
```

### POST /wallet/verify

Verify the wallet for the authenticated user.

**Authentication**: Required (Bearer token)

**Rate Limits**:
- 5 attempts per hour
- 10 attempts per day

**Response**:
```json
{
  "verified": true,
  "verifiedAt": "2025-12-28T03:00:00.000Z"
}
```

**Error Responses**:

Rate limit exceeded (429):
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "You have exceeded the maximum of 5 verification attempts per hour. Please try again later.",
  "resetTime": "2025-12-28T04:00:00.000Z"
}
```

User not found (400):
```json
{
  "statusCode": 400,
  "message": "User not found"
}
```

## Database Schema

### User Schema Updates

Added to the existing `User` schema:

```typescript
{
  walletVerified: {
    type: Boolean,
    default: false
  },
  walletVerifiedAt: {
    type: Date,
    required: false
  }
}
```

### WalletVerificationAttempt Schema

Tracks all wallet verification attempts for audit and rate limiting:

```typescript
{
  userId: ObjectId,           // Reference to user
  status: String,             // 'pending' | 'success' | 'failed'
  failureReason?: String,     // Reason for failure (if applicable)
  ipAddress?: String,         // Request IP address
  userAgent?: String,         // Request user agent
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ userId: 1, createdAt: -1 }` - For rate limiting queries
- `{ status: 1, createdAt: -1 }` - For audit queries

## Services

### WalletService

Main service for wallet operations.

**Methods**:
- `getBalance(userId: ObjectId): Promise<WalletBalanceDto>` - Get user balance with verification status
- `getVerificationStatus(userId: ObjectId): Promise<WalletVerificationStatusDto>` - Check verification status
- `verifyWallet(userId: ObjectId, metadata?: {...}): Promise<WalletVerificationStatusDto>` - Verify wallet
- `isWalletVerified(userId: ObjectId): Promise<boolean>` - Check if wallet is verified

### WalletRateLimitService

Handles rate limiting for wallet operations.

**Methods**:
- `checkVerificationRateLimit(userId: ObjectId): Promise<void>` - Throws if rate limit exceeded
- `recordAttempt(userId: ObjectId, status: string, metadata?: {...}): Promise<void>` - Record verification attempt
- `getAttemptStats(userId: ObjectId): Promise<{...}>` - Get attempt statistics

**Rate Limits**:
- Maximum 5 verification attempts per hour per user
- Maximum 10 verification attempts per day per user

## Security Features

### Authentication
All wallet endpoints require authentication via `AuthGuard`. Requests must include a valid Bearer token.

### Rate Limiting
Verification attempts are rate-limited to prevent abuse:
- Hourly limit: 5 attempts
- Daily limit: 10 attempts

When limits are exceeded, users receive a `429 Too Many Requests` response with a `resetTime` indicating when they can try again.

### Audit Trail
Every verification attempt is logged with:
- User ID
- Attempt status (pending/success/failed)
- Failure reason (if applicable)
- IP address
- User agent string
- Timestamp

This provides complete auditability for security and compliance purposes.

### Input Validation
All DTOs use class-validator decorators to ensure data integrity:
- `@IsNumber()` for numeric fields
- `@IsBoolean()` for boolean fields
- `@IsISO8601()` for date fields
- `@IsOptional()` for optional fields

## Testing

The module includes comprehensive unit tests covering:
- Balance retrieval with various user states
- Verification status checks
- Wallet verification with rate limiting
- Error handling for missing users
- Rate limit enforcement

Run tests:
```bash
yarn test wallet.service.spec.ts
```

All 13 tests pass successfully.

## Integration

The Wallet Module is integrated into the main application via `WalletModule`:

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: WalletVerificationAttempt.name, schema: WalletVerificationAttemptSchema }
    ])
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRateLimitService],
  exports: [WalletService, WalletRateLimitService]
})
export class WalletModule {}
```

The module is registered in `app.module.ts` and is available throughout the application.

## Future Enhancements

The current implementation provides a foundation for wallet verification. Future enhancements could include:

1. **Enhanced Verification Methods**:
   - Identity document verification
   - Two-factor authentication for verification
   - Integration with third-party KYC services

2. **Verification Levels**:
   - Basic verification (email only)
   - Intermediate verification (phone + email)
   - Full verification (documents + identity)

3. **Verification Rewards**:
   - Bonus credits for verified users
   - Reduced transaction fees
   - Access to premium features

4. **Admin Controls**:
   - Manual verification approval/rejection
   - Verification audit dashboard
   - Suspicious activity alerts

## References

- **Security Policy**: `/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`
- **Copilot Governance**: `/COPILOT_GOVERNANCE.md`
- **Contributing Guide**: `/CONTRIBUTING.md`
