# Slot Machine Module

## Overview

This module implements the core backend/API scaffolding for the Slot Machine feature in XXXChatNow. It provides a secure, auditable, and scalable slot machine game system integrated with the platform's loyalty points system.

## References

This implementation strictly follows:
- **[XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md](../../../../../XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md)** - Official feature specification
- **[SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](../../../../../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements
- **[COPILOT_GOVERNANCE.md](../../../../../COPILOT_GOVERNANCE.md)** - Development standards

## Architecture

### Components

```
slot-machine/
├── controllers/          # API endpoints
│   ├── slot-machine.controller.ts        # User-facing endpoints
│   └── admin-slot-machine.controller.ts  # Admin management endpoints
├── services/            # Business logic
│   ├── slot-machine.service.ts           # Core game logic
│   ├── slot-machine-rng.service.ts       # CSPRNG-based RNG
│   ├── slot-machine-config.service.ts    # Configuration management
│   └── slot-machine-rate-limit.service.ts # Rate limiting
├── schemas/             # MongoDB schemas
│   ├── slot-machine-transaction.schema.ts # Immutable transaction records
│   └── slot-machine-config.schema.ts      # Versioned configuration
├── dtos/                # Data transfer objects
├── payloads/            # Request validation
├── listeners/           # Event handlers for audit logging
└── constants.ts         # Module constants
```

## Security Features

### ✅ Implemented Security Requirements

1. **Cryptographically Secure RNG**
   - Uses Node.js `crypto.randomBytes()` (CSPRNG)
   - NO use of `Math.random()` (prohibited for financial operations)
   - Verifiable in tests

2. **Rate Limiting**
   - 100 spins per hour per user (configurable)
   - Persistent across server restarts (MongoDB-based)
   - Anomaly detection for suspicious patterns

3. **Idempotency**
   - Unique idempotency key required for each spin
   - Prevents duplicate transactions
   - Safe for retry operations

4. **Atomic Operations**
   - Database transactions prevent race conditions
   - Balance updates are atomic
   - No partial state changes

5. **Audit Trail**
   - Complete transaction logging
   - Integrity hashes for tamper detection
   - NO PII in logs (user IDs only)
   - 8-year retention policy support

6. **Server-Side Validation**
   - All calculations happen server-side
   - Client input never trusted for outcomes
   - Balance validation before spin
   - Configuration-based payout calculation

7. **Authentication & Authorization**
   - All endpoints require authentication
   - Role-based access control
   - User can only access their own data

## API Endpoints

### User Endpoints

#### POST `/api/v1/slot-machine/spin`
**UI HOOK POINT**: Initiate a slot machine spin

**Headers:**
```
Authorization: Bearer <token>
Idempotency-Key: <unique-key>
```

**Request:**
```json
{
  "betAmount": 100
}
```

**Response:**
```json
{
  "spinId": "spin_1234567890_abc123...",
  "timestamp": "2025-12-19T05:00:00.000Z",
  "betAmount": 100,
  "result": {
    "symbols": ["cherry", "cherry", "cherry"],
    "isWin": true,
    "payout": 150,
    "multiplier": 1.5
  },
  "newBalance": 2050,
  "previousBalance": 2000
}
```

#### GET `/api/v1/slot-machine/history`
**UI HOOK POINT**: Get user's spin history

**Query Parameters:**
- `limit` (default: 20)
- `offset` (default: 0)

#### GET `/api/v1/slot-machine/config`
**UI HOOK POINT**: Get current slot machine configuration

Returns symbols, payouts, spin cost, and rate limits.

#### GET `/api/v1/slot-machine/rate-limit`
**UI HOOK POINT**: Get remaining spins

Returns remaining spins in current hour and reset time.

### Admin Endpoints

#### GET `/api/v1/admin/slot-machine/configs`
Get all configurations (admin only)

#### POST `/api/v1/admin/slot-machine/config`
Create new configuration (admin only)

#### PUT `/api/v1/admin/slot-machine/config/:id/activate`
Activate a configuration (admin only)

## Configuration

### Default Configuration

Based on briefing specifications:

```javascript
{
  spinCost: 100,           // Loyalty points per spin
  returnToPlayer: 0.95,    // 95% RTP
  maxSpinsPerHour: 100,    // Rate limit
  symbols: [
    { id: "cherry", rarity: 0.30, payout_3x: 150 },
    { id: "lemon", rarity: 0.25, payout_3x: 200 },
    { id: "orange", rarity: 0.20, payout_3x: 300 },
    { id: "plum", rarity: 0.12, payout_3x: 500 },
    { id: "bell", rarity: 0.08, payout_3x: 1000 },
    { id: "star", rarity: 0.03, payout_3x: 2500 },
    { id: "seven", rarity: 0.015, payout_3x: 5000 },
    { id: "diamond", rarity: 0.005, payout_3x: 10000 }
  ]
}
```

### Hot-Reloadable Configuration

Configurations are versioned and can be updated without deployment:
1. Create new configuration via admin endpoint
2. Activate when ready
3. Changes take effect immediately

## Integration Points

### TODO: RedRoomRewards API Integration

Currently using direct user balance updates. Need to integrate with RedRoomRewards API:

```typescript
// In slot-machine.service.ts (lines marked with TODO)

// Deduct points
await loyaltyService.deduct({
  userId,
  amount: betAmount,
  reason: 'slot_machine_spin',
  transactionId: spinId,
  idempotencyKey
});

// Credit winnings
await loyaltyService.credit({
  userId,
  amount: payout,
  reason: 'slot_machine_win',
  transactionId: spinId,
  metadata: { symbols, multiplier }
});
```

### TODO: Age & Jurisdiction Compliance

Add compliance checks before allowing spins:

```typescript
// In slot-machine.service.ts (line ~87)
await this.checkAgeCompliance(userId);
await this.checkJurisdictionCompliance(userId);
```

## Testing

### Unit Tests

Run tests for RNG service:
```bash
cd /home/runner/work/XXXChatNow/XXXChatNow/api
yarn test slot-machine-rng.service.spec.ts
```

Tests include:
- CSPRNG verification (no Math.random)
- Symbol selection probability distribution
- Spin ID uniqueness
- Integrity hash consistency

### Integration Tests (TODO)

Create tests for:
- Complete spin workflow
- Rate limiting enforcement
- Idempotency key validation
- Balance atomicity

### E2E Tests (TODO)

Test complete user flows:
- User registration → spin → view history
- Rate limit exceeded scenario
- Insufficient balance scenario

## Monitoring & Alerts

### Anomaly Detection

The system automatically detects suspicious patterns:

1. **Rapid Spinning**: More than 50 spins in 5 minutes
2. **Unusual Win Rate**: Win rate > 99% (statistically impossible)

When detected, alerts are logged for security team review.

### Audit Logging

All spins are logged with:
- Spin ID (unique identifier)
- User ID (no PII)
- Bet amount
- Result (win/loss)
- Payout
- Timestamp
- Integrity hash

**NO sensitive data logged:**
- ❌ No names, emails, phone numbers
- ❌ No IP addresses (stored separately, not logged)
- ❌ No session tokens
- ❌ No payment details

## Data Retention

Per **SECURITY_AUDIT_POLICY_AND_CHECKLIST.md**:

- **Hot storage**: 18 months (easily accessible)
- **Cold storage**: 6.5 years (WORM-capable, e.g., S3 Object Lock)
- **Total retention**: 8 years
- **Archive flag**: Transactions marked `archived: true` instead of deleted

## Frontend Integration (Future)

### UI Hook Points

The following endpoints are ready for frontend integration:

1. **Spin Button**: `POST /slot-machine/spin`
   - Display loading animation
   - Show result with symbols
   - Update user balance

2. **History Tab**: `GET /slot-machine/history`
   - Paginated list of past spins
   - Filter by date range (TODO)

3. **Config Display**: `GET /slot-machine/config`
   - Show paytable
   - Display spin cost
   - Show rate limits

4. **Rate Limit Indicator**: `GET /slot-machine/rate-limit`
   - Show "X spins remaining"
   - Countdown to reset time

### TODO: WebSocket Support

Add real-time spin results via WebSocket for better UX:
```typescript
// In slot-machine.controller.ts
@WebSocketGateway()
export class SlotMachineGateway {
  @SubscribeMessage('spin')
  handleSpin(client: Socket, payload: SpinPayload) {
    // Emit results in real-time
  }
}
```

## Development Notes

### Linting & Code Style

Follow repository conventions:
- `camelCase` for variables and functions
- `PascalCase` for classes and types
- Comprehensive comments explaining WHY, not WHAT
- All security-critical code documented

### Git Commits

Follow Conventional Commits:
```
feat(slot-machine): add spin endpoint with CSPRNG
fix(slot-machine): prevent race condition in balance update
docs(slot-machine): update API documentation
```

## Production Checklist

Before deploying to production:

- [ ] Install dependencies: `yarn install`
- [ ] Run tests: `yarn test`
- [ ] Run linting: `yarn lint`
- [ ] Verify MongoDB indexes created
- [ ] Configure rate limits in production config
- [ ] Set up monitoring alerts for anomalies
- [ ] Complete RedRoomRewards API integration
- [ ] Implement age/jurisdiction compliance checks
- [ ] Load test with expected traffic (1000 spins/sec)
- [ ] Security audit completed
- [ ] Legal/compliance review completed

## Known Limitations

1. **No third-party/white-label support**: This implementation is for XXXChatNow platform only. Future abstraction for third-party APIs is out of scope per requirements.

2. **Balance integration**: Currently uses direct user balance updates. Needs RedRoomRewards API integration for production.

3. **Basic payout logic**: Only checks for 3 matching symbols. Future enhancements could include:
   - Multiple paylines
   - Scatter symbols
   - Bonus rounds
   - Progressive jackpots

## Support & Questions

For questions or issues:
- Review briefing documents first
- Check security policy for compliance requirements
- Refer to contributing guide for development standards
- Contact engineering team for technical questions

## License

Proprietary - XXXChatNow Platform
