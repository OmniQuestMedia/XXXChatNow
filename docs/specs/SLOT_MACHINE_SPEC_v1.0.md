# XXXChatNow Slot Machine Feature - Technical Specification v1.0

**Version**: 1.0  
**Status**: Authoritative  
**Created**: 2025-12-15  
**Last Updated**: 2025-12-15  
**Based On**: XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md

---

## Executive Summary

This document serves as the **authoritative technical specification** for the XXXChatNow Slot Machine feature. All implementation work must strictly adhere to the requirements, boundaries, acceptance criteria, and server-authoritative token mechanics defined in this document.

**Implementation is BLOCKED until this specification is approved by all stakeholders.**

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Ownership and Boundaries](#ownership-and-boundaries)
3. [Server-Authoritative Token Mechanics](#server-authoritative-token-mechanics)
4. [Security Requirements](#security-requirements)
5. [Performance Requirements](#performance-requirements)
6. [Slot Machine Configuration](#slot-machine-configuration)
7. [API Specification](#api-specification)
8. [Data Models](#data-models)
9. [Loyalty Points Integration](#loyalty-points-integration)
10. [Acceptance Tests](#acceptance-tests)
11. [Implementation Phases](#implementation-phases)
12. [Risks and Mitigations](#risks-and-mitigations)

---

## Feature Overview

### Purpose

The Slot Machine feature provides users with an engaging, gamified experience within the XXXChatNow platform. Users can spend loyalty points for a chance to win credits, bonuses, or other rewards through a virtual slot machine mechanic.

### Core Principles

1. **Server-Authoritative**: All game logic, RNG, and token calculations occur server-side
2. **Fair Gaming**: Cryptographically secure RNG ensures provably fair outcomes
3. **Auditable**: Complete transaction history for compliance and fraud detection
4. **Secure**: No client-side manipulation possible
5. **Scalable**: Designed to handle thousands of concurrent users

---

## Ownership and Boundaries

### Feature Ownership
- **Product Owner**: Platform Product Team
- **Technical Owner**: Backend Engineering Team
- **Security Review**: Security Engineering Team
- **Compliance Review**: Legal & Compliance Team

### Scope Boundaries

**In Scope:**
- Slot machine game logic and mechanics
- Integration with loyalty points system
- Reward distribution and credit management
- User interface components for slot machine
- Transaction logging and audit trail
- Rate limiting and fraud prevention
- Analytics and reporting for slot machine usage

**Out of Scope:**
- Modifications to core user authentication system
- Changes to existing payment processing infrastructure
- Implementation of other casino-style games (separate features)
- Modifications to existing loyalty points earning mechanisms

### System Boundaries
- **Frontend**: User interface components within XXXChatNow web and mobile applications
- **Backend**: Slot machine service API, loyalty points integration, reward distribution
- **Database**: Dedicated slot machine transactions table, read access to loyalty points
- **External Dependencies**: Loyalty API (read/write), User Service (read-only)

---

## Server-Authoritative Token Mechanics

### Authoritative Flow

**ALL token operations follow this server-authoritative pattern:**

1. **Client Request**: User initiates spin via UI
2. **Server Validation**: Server validates authentication, balance, rate limits
3. **Server Execution**: Server deducts points, generates outcome, calculates payout
4. **Server Commitment**: Server commits transaction to database (immutable)
5. **Client Notification**: Server sends result to client for display only

**Client NEVER:**
- Calculates outcomes or payouts
- Determines win/loss conditions
- Modifies token balances
- Generates random numbers
- Validates transactions

**Server ALWAYS:**
- Generates all random outcomes using CSPRNG
- Calculates all payouts and rewards
- Validates all preconditions (balance, rate limits)
- Creates immutable audit records
- Manages all token state changes

### Token State Management

#### Balance Tracking
- **Source of Truth**: Database loyalty_points.balance field
- **Update Pattern**: Atomic transaction with row-level locking
- **Validation**: Balance must match sum of transaction history
- **Consistency**: Strong consistency required for deductions, eventual consistency acceptable for analytics

#### Transaction Atomicity
All token operations follow this pattern:
```
BEGIN TRANSACTION
  1. Lock user balance row (SELECT FOR UPDATE)
  2. Validate sufficient balance
  3. Generate spin outcome (CSPRNG)
  4. Calculate payout
  5. Deduct spin cost
  6. Credit winnings (if applicable)
  7. Insert immutable transaction record
  8. Update balance
COMMIT TRANSACTION
```

If any step fails, entire transaction rolls back.

### Idempotency

Every spin request includes an idempotency key:
- First request: Process normally and store key
- Duplicate request: Return cached response, no state change
- Key expiration: 24 hours (configurable)
- Storage: Redis or database table

### Race Condition Prevention

**Database-Level Locking:**
```sql
-- Lock user balance for update with timeout
-- Use short timeout to balance performance with reliability
SELECT balance FROM loyalty_points 
WHERE user_id = $1 
FOR UPDATE;  -- PostgreSQL default lock timeout applies

-- Alternative with explicit timeout (PostgreSQL):
SET lock_timeout = '5s';
SELECT balance FROM loyalty_points 
WHERE user_id = $1 
FOR UPDATE;
```

**Optimistic Concurrency Alternative:**
```sql
-- Update with version check
UPDATE loyalty_points 
SET balance = balance - $2, version = version + 1
WHERE user_id = $1 AND version = $3;
```

### Security Guarantees

1. **Client Cannot Cheat**: All logic server-side, client displays only
2. **Reproducible Outcomes**: Transaction ID allows audit reproduction
3. **Tamper-Proof**: Signed responses prevent client modification
4. **Rate Limited**: Maximum 100 spins per user per hour
5. **Balance Protected**: Atomic operations prevent concurrent corruption

---

## Security Requirements

### Authentication and Authorization

#### User Authentication
- All slot machine operations require valid JWT or session token
- Token must not be expired (max 24 hour lifetime)
- Session must be active and not revoked

#### Authorization
- Users can only perform operations on their own account
- Admin endpoints require admin role verification
- Cross-account operations strictly prohibited

#### Session Validation
- Validate session token on every API request
- Check token signature and expiration
- Verify user status (active, not banned)

#### Rate Limiting
- **User Limit**: Maximum 100 spins per user per hour
- **IP Limit**: Maximum 500 spins per IP per hour
- **Global Limit**: Maximum 1,000 spins per second system-wide
- **Burst Allowance**: Up to 10 spins in 1 second burst

### Data Security

#### Encryption in Transit
- All API communications use TLS 1.3
- Certificate pinning on mobile apps
- HSTS headers enforce HTTPS

#### Encryption at Rest
- Sensitive transaction data encrypted using AES-256
- Encryption keys managed via KMS (AWS KMS, HashiCorp Vault)
- Regular key rotation (quarterly)

#### PII Protection
- No personally identifiable information in slot machine transaction logs
- IP addresses hashed for fraud detection
- User agents stored but not exposed via API

#### Secure Random Number Generation
- Use cryptographically secure PRNG (CSPRNG)
- Node.js: `crypto.randomBytes()` or `crypto.randomInt()`
- Never use `Math.random()` for game outcomes
- Seed management and entropy pool maintenance

### Fraud Prevention

#### Transaction Integrity
- Every spin recorded with immutable transaction ID (UUID v4)
- Transactions append-only, never updated or deleted
- Cryptographic hash of transaction data stored

#### Idempotency Keys
- Required on all state-changing operations
- UUID v4 format, client-generated
- Server validates and stores to prevent duplicates
- 24-hour expiration window

#### Balance Validation
- Verify sufficient loyalty points before allowing spin
- Atomic deduction prevents overdraft
- Reconciliation job runs hourly to verify balance integrity

#### Reward Validation
- Server-side calculation of all rewards
- Never trust client-submitted payout amounts
- Validate symbol combinations against configuration
- Log discrepancies as critical security alerts

#### Audit Trail
Complete audit log includes:
- User ID (UUID)
- Spin ID (UUID)
- Timestamp (ISO8601 with timezone)
- Bet amount (integer)
- Result symbols (array of strings)
- Payout amount (integer)
- Balance before/after (integers)
- Session ID
- IP address (hashed)
- User agent
- Idempotency key

#### Anomaly Detection
Flag suspicious patterns:
- Win rate significantly above expected RTP (>3 standard deviations)
- Rapid spinning (>5 spins in 5 seconds)
- Multiple accounts from same IP winning frequently
- Unusual betting patterns
- Consistent wins from specific symbols

Alert security team for manual review.

### Compliance

#### Age Verification
- Verify user age >= 18 (or jurisdiction requirement)
- Block access for users without verified age
- Re-verification annually

#### Responsible Gaming
- Implement daily spending limits (default: 1000 points/day)
- Implement weekly spending limits (default: 5000 points/week)
- Allow users to set lower custom limits
- Display spending totals prominently
- Provide links to gambling support resources

#### Terms of Service
- Users must accept slot machine-specific terms before first use
- Terms include RTP disclosure, odds explanation, no-refund policy
- Track acceptance timestamp and version

#### Jurisdiction Compliance
- Maintain list of prohibited jurisdictions
- Block feature based on IP geolocation and user profile country
- Update list based on legal guidance
- Display "not available in your region" message

---

## Performance Requirements

### Latency Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Balance Check | 50ms | 100ms | 200ms |
| Spin Request | 100ms | 200ms | 400ms |
| Result Display | 150ms | 300ms | 500ms |
| Reward Credit | 100ms | 200ms | 400ms |
| History Query | 75ms | 150ms | 300ms |

### Throughput Requirements

- **Concurrent Users**: Support 10,000 concurrent slot machine users
- **Spins per Second**: Handle 1,000 spins per second system-wide
- **Peak Load**: Handle 3x normal load during peak hours (3,000 spins/sec)
- **Database TPS**: Minimum 5,000 transactions per second

### Availability Requirements

- **Uptime SLA**: 99.9% availability (max 43 minutes downtime per month)
- **Graceful Degradation**: If slot machine unavailable, display maintenance message
- **Data Consistency**: Strong consistency for balance operations
- **Replication Lag**: < 100ms for read replicas

### Scalability

#### Horizontal Scaling
- Stateless API servers behind load balancer
- Auto-scaling based on CPU/memory/request rate
- Minimum 3 instances, maximum 20 instances

#### Database Sharding
- Partition slot machine transactions by user_id hash
- Use consistent hashing for shard assignment
- Support for adding/removing shards dynamically

#### Caching Strategy
- Cache slot machine configuration (Redis, 5-minute TTL)
- Cache user balance (Redis, 30-second TTL)
- Cache odds tables (Redis, 1-hour TTL)
- Invalidate cache on configuration changes

---

## Slot Machine Configuration

### Slot Machine Mechanics

#### Basic Configuration
- **Reels**: 3-reel virtual slot machine
- **Symbols**: 8 distinct symbols with varying rarities
- **Paylines**: Single payline (horizontal center line)
- **Spin Cost**: Configurable loyalty points cost (default: 100 points)
- **Return to Player (RTP)**: 95% (configurable)

### Symbols and Payouts

**Note**: The table below shows illustrative symbol rarities only. Actual payout values must be calculated using proper RTP mathematics to achieve the target 95% return to player. The final configuration requires:

1. Mathematical modeling to determine exact payout values
2. Simulation testing with 1+ million spins to verify RTP
3. Actuarial review to ensure financial sustainability
4. Stakeholder approval before implementation

| Symbol | Rarity | 3-Match Payout | Notes |
|--------|--------|----------------|-------|
| Cherry | 30% | TBD | Most common, lowest payout |
| Lemon | 25% | TBD | Common, low payout |
| Orange | 20% | TBD | Medium-common, moderate payout |
| Plum | 12% | TBD | Medium-rare, moderate payout |
| Bell | 8% | TBD | Rare, good payout |
| Star | 3% | TBD | Very rare, high payout |
| Seven | 1.5% | TBD | Extremely rare, very high payout |
| Diamond | 0.5% | TBD | Ultra rare, jackpot payout |

**Target RTP**: 95% (for every 100 points wagered, average return is 95 points)

**Mathematical Requirements**:
- Total probability across all symbols must equal 100%
- Expected value calculation: Σ(Probability × Payout) must equal 95 points
- Variance and standard deviation must be calculated for user experience
- House edge: 5% (100% - 95% RTP)

### Configuration Schema

```json
{
  "configVersion": "1.0",
  "configName": "default",
  "isActive": true,
  "effectiveDate": "2025-12-15T00:00:00Z",
  "spinCost": 100,
  "returnToPlayer": 0.95,
  "maxSpinsPerHour": 100,
  "symbols": [
    {
      "id": "cherry",
      "name": "Cherry",
      "rarity": 0.30,
      "imageUrl": "/images/symbols/cherry.png",
      "payouts": {
        "three": null  // TBD: Calculate based on RTP requirements
      }
    },
    {
      "id": "lemon",
      "name": "Lemon",
      "rarity": 0.25,
      "imageUrl": "/images/symbols/lemon.png",
      "payouts": {
        "three": null  // TBD: Calculate based on RTP requirements
      }
    },
    {
      "id": "orange",
      "name": "Orange",
      "rarity": 0.20,
      "imageUrl": "/images/symbols/orange.png",
      "payouts": {
        "three": null  // TBD: Calculate based on RTP requirements
      }
    }
    // ... additional symbols with payouts calculated to achieve 95% RTP
  ]
}
```

**Configuration Notes**:
- Payout values must be determined through mathematical modeling
- Configuration must be validated to ensure actual RTP matches target (95% ±1%)
- Simulation testing required before activating any configuration
- All configurations must be approved by Product Owner and reviewed by Finance team

### Configuration Management

#### Hot Configuration
- Odds and payouts adjustable via admin API
- No deployment required for configuration changes
- Changes take effect within 5 minutes (cache TTL)

#### Version Control
- All configuration changes versioned in database
- Audit log records who, when, what changed
- Ability to rollback to previous configuration

#### A/B Testing
- Support for multiple active configurations
- Random assignment of users to configuration variants
- Track performance metrics per configuration
- Automated winner selection based on engagement metrics

#### Fairness Validation
- Mathematical model validates RTP matches configured value
- Simulation runs 1 million spins to verify RTP within ±1%
- Alerts if actual RTP deviates by >2% over 10,000 spins

#### Regulatory Compliance
- Configuration locked for audit period (30 days)
- Cannot modify historical configuration versions
- Certified configurations marked immutable

---

## API Specification

### Base URL
```
Production: https://api.xxxchatnow.com/v1
Staging: https://api-staging.xxxchatnow.com/v1
Development: http://localhost:3000/v1
```

### Authentication
All endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Spin Slot Machine

**Endpoint**: `POST /slot-machine/spin`

**Request Headers**:
```
Authorization: Bearer <token>
Idempotency-Key: <uuid-v4>
Content-Type: application/json
```

**Request Body**:
```json
{
  "betAmount": 100
}
```

**Success Response (200)**:
```json
{
  "spinId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-15T12:34:56.789Z",
  "betAmount": 100,
  "result": {
    "symbols": ["cherry", "cherry", "cherry"],
    "isWin": true,
    "payout": 150,
    "multiplier": 1.5
  },
  "balance": {
    "previous": 1000,
    "current": 1050,
    "change": 50
  },
  "rtp": 0.95
}
```

**Error Responses**:

```json
// 400 - Insufficient Balance
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "You do not have enough loyalty points to spin.",
  "currentBalance": 50,
  "requiredBalance": 100
}

// 429 - Rate Limit Exceeded
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "You have exceeded the maximum spins per hour.",
  "retryAfter": 1800,
  "spinsRemaining": 0,
  "resetsAt": "2025-12-15T14:00:00Z"
}

// 400 - Invalid Bet Amount
{
  "error": "INVALID_BET",
  "message": "Bet amount must match configured spin cost.",
  "validBetAmount": 100
}

// 409 - Duplicate Request
{
  "error": "DUPLICATE_REQUEST",
  "message": "This spin has already been processed.",
  "originalSpinId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get Spin History

**Endpoint**: `GET /slot-machine/history`

**Query Parameters**:
- `limit` (integer, default: 20, max: 100)
- `offset` (integer, default: 0)
- `startDate` (ISO8601, optional)
- `endDate` (ISO8601, optional)

**Response (200)**:
```json
{
  "spins": [
    {
      "spinId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2025-12-15T12:34:56.789Z",
      "betAmount": 100,
      "symbols": ["cherry", "lemon", "orange"],
      "payout": 0,
      "isWin": false,
      "balanceAfter": 900
    },
    // ... more spins
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "statistics": {
    "totalSpins": 150,
    "totalWagered": 15000,
    "totalWon": 14250,
    "netResult": -750,
    "winRate": 0.42,
    "biggestWin": 1000
  }
}
```

### Get User Balance

**Endpoint**: `GET /loyalty/balance`

**Response (200)**:
```json
{
  "userId": "user-uuid",
  "balance": 1000,
  "currency": "points",
  "lastUpdated": "2025-12-15T12:34:56.789Z"
}
```

### Get Slot Machine Configuration

**Endpoint**: `GET /slot-machine/config`

**Response (200)**:
```json
{
  "configVersion": "1.0",
  "spinCost": 100,
  "returnToPlayer": 0.95,
  "maxSpinsPerHour": 100,
  "symbols": [
    {
      "id": "cherry",
      "name": "Cherry",
      "rarity": 0.30,
      "payouts": {
        "three": 150
      }
    }
    // ... more symbols
  ]
}
```

---

## Data Models

### Slot Machine Transactions Table

```sql
CREATE TABLE slot_machine_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Spin Information
  spin_id VARCHAR(64) UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Bet and Results
  bet_amount INTEGER NOT NULL CHECK (bet_amount > 0),
  result_symbols VARCHAR(50)[] NOT NULL CHECK (array_length(result_symbols, 1) = 3),
  is_win BOOLEAN NOT NULL,
  payout INTEGER NOT NULL DEFAULT 0 CHECK (payout >= 0),
  
  -- Balance Tracking
  balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  
  -- Integration
  loyalty_transaction_id VARCHAR(64),
  
  -- Idempotency and Security
  idempotency_key VARCHAR(128) UNIQUE,
  session_id VARCHAR(64),
  ip_address_hash VARCHAR(64),  -- hashed for privacy
  user_agent TEXT,
  
  -- Configuration Reference
  config_version VARCHAR(20) NOT NULL,
  
  -- Audit Trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_user_timestamp (user_id, timestamp DESC),
  INDEX idx_spin_id (spin_id),
  INDEX idx_idempotency (idempotency_key),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_is_win (is_win, timestamp DESC)
);

-- Partition by month for performance
CREATE TABLE slot_machine_transactions_y2025m12 PARTITION OF slot_machine_transactions
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

### Slot Machine Configuration Table

```sql
CREATE TABLE slot_machine_config (
  -- Primary Key
  id SERIAL PRIMARY KEY,
  
  -- Configuration Metadata
  config_name VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Configuration Data
  spin_cost INTEGER NOT NULL CHECK (spin_cost > 0),
  symbols JSONB NOT NULL,
  return_to_player DECIMAL(5,4) NOT NULL CHECK (return_to_player > 0 AND return_to_player <= 1),
  max_spins_per_hour INTEGER NOT NULL CHECK (max_spins_per_hour > 0),
  
  -- Validity Period
  effective_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  
  -- Audit Trail
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Certification
  is_certified BOOLEAN NOT NULL DEFAULT false,
  certified_by VARCHAR(100),
  certified_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(config_name, version),
  CHECK (end_date IS NULL OR end_date > effective_date)
);

-- Only one active config per name at a time
CREATE UNIQUE INDEX idx_active_config 
  ON slot_machine_config (config_name) 
  WHERE is_active = true;
```

### Idempotency Keys Table

```sql
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(128) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  response_body JSONB NOT NULL,
  response_status INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  INDEX idx_key_user (idempotency_key, user_id),
  INDEX idx_expires (expires_at)
);

-- Clean up expired keys daily
CREATE INDEX idx_expired_keys ON idempotency_keys (expires_at) WHERE expires_at < NOW();
```

---

## Loyalty Points Integration

### Loyalty API Contract

#### Check User Balance

```
GET /api/v1/loyalty/balance
Authorization: Bearer <token>

Response 200:
{
  "userId": "string",
  "balance": number,
  "currency": "points",
  "lastUpdated": "ISO8601"
}
```

#### Deduct Points for Spin

```
POST /api/v1/loyalty/deduct
Authorization: Bearer <token>
Idempotency-Key: <unique-key>

Body:
{
  "userId": "string",
  "amount": number,
  "reason": "slot_machine_spin",
  "transactionId": "string",
  "metadata": {
    "spinId": "string",
    "betAmount": number
  }
}

Response 200:
{
  "success": true,
  "newBalance": number,
  "transactionId": "string"
}

Response 400:
{
  "success": false,
  "error": "INSUFFICIENT_BALANCE",
  "currentBalance": number
}
```

#### Credit Reward Points

```
POST /api/v1/loyalty/credit
Authorization: Bearer <token>
Idempotency-Key: <unique-key>

Body:
{
  "userId": "string",
  "amount": number,
  "reason": "slot_machine_win",
  "transactionId": "string",
  "metadata": {
    "spinId": "string",
    "symbols": ["string"],
    "multiplier": number,
    "payout": number
  }
}

Response 200:
{
  "success": true,
  "newBalance": number,
  "transactionId": "string"
}
```

### Integration Requirements

#### Retry Logic
- Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
- Maximum 5 retries
- Only retry on transient errors (5xx, network timeout)
- Do not retry on 4xx client errors

#### Circuit Breaker
- Open circuit after 5 consecutive failures
- Half-open after 30 seconds
- Close after 3 consecutive successes
- Fail fast when circuit open

#### Timeout
- Connection timeout: 2 seconds
- Read timeout: 5 seconds
- Total request timeout: 10 seconds

#### Transaction Rollback
- If loyalty deduction succeeds but spin fails: reverse deduction
- If spin succeeds but credit fails: retry credit with exponential backoff
- Store pending credits in database for manual reconciliation if all retries fail

---

## Acceptance Tests

### Functional Requirements

#### FR-1: View Loyalty Points Balance
**Given** a user is authenticated  
**When** they navigate to the slot machine page  
**Then** their current loyalty points balance is displayed  
**And** the balance updates in real-time after each spin

#### FR-2: Initiate Slot Machine Spin
**Given** a user has sufficient loyalty points (≥100)  
**When** they click the "Spin" button  
**Then** 100 points are deducted from their balance  
**And** the slot machine animation plays  
**And** the result is displayed within 300ms

#### FR-3: Generate Fair Random Results
**Given** the server receives a spin request  
**When** the spin is processed  
**Then** outcomes are generated using CSPRNG  
**And** symbol distribution matches configured rarities over 10,000 spins (±2%)  
**And** RTP converges to 95% over 100,000 spins (±1%)

#### FR-4: Calculate Correct Payouts
**Given** a spin results in three matching symbols  
**When** the server calculates the payout  
**Then** the payout matches the configured amount for that symbol  
**And** the user's balance is credited correctly

**Test Cases:**
- Cherry-Cherry-Cherry → 150 points
- Lemon-Lemon-Lemon → 200 points
- Diamond-Diamond-Diamond → 10,000 points
- Cherry-Lemon-Orange → 0 points (no win)

#### FR-5: Credit Winning Payouts
**Given** a user wins a spin  
**When** the payout is calculated  
**Then** the winnings are added to the user's loyalty balance  
**And** a credit transaction is recorded in the audit log  
**And** the balance update is atomic (all-or-nothing)

#### FR-6: View Transaction History
**Given** a user has spun the slot machine  
**When** they view their history  
**Then** all spins are listed with timestamp, bet, symbols, and payout  
**And** pagination works correctly  
**And** results are sorted newest first

#### FR-7: Enforce Rate Limits
**Given** a user has spun 100 times in an hour  
**When** they attempt a 101st spin  
**Then** the request is rejected with 429 status  
**And** a message displays "Rate limit exceeded"  
**And** the retry time is shown

#### FR-8: Prevent Insufficient Balance Spins
**Given** a user has 50 loyalty points  
**When** they attempt to spin (cost: 100 points)  
**Then** the request is rejected with 400 status  
**And** a message displays "Insufficient balance"  
**And** the current balance is shown

#### FR-9: Idempotency Prevents Duplicates
**Given** a client sends a spin request with idempotency key "abc123"  
**When** the same request is sent again with key "abc123"  
**Then** the second request returns the cached response  
**And** no duplicate transaction is created  
**And** the user's balance is only deducted once

#### FR-10: Configuration Changes Without Restart
**Given** an admin updates the slot machine configuration  
**When** the update is saved  
**Then** new spins use the updated configuration within 5 minutes  
**And** in-flight spins complete with the old configuration  
**And** no service restart is required

### Security Requirements

#### SEC-1: Authentication Required
**Given** a user is not authenticated  
**When** they attempt to spin the slot machine  
**Then** the request is rejected with 401 status  
**And** an error message displays "Authentication required"

#### SEC-2: Client Cannot Manipulate Results
**Given** a malicious client attempts to:
- Send predetermined symbols
- Modify payout amounts
- Bypass balance checks
- Replay old transactions

**Then** all attempts are rejected  
**And** outcomes are determined server-side only  
**And** security alerts are logged

#### SEC-3: Complete Audit Trail
**Given** any slot machine operation occurs  
**Then** an audit record is created with:
- User ID
- Operation type
- Amount
- Timestamp
- IP address
- Session ID
- Transaction ID

**And** audit records are immutable  
**And** records are retained per policy (8 years)

#### SEC-4: RNG Cryptographic Security
**Given** the RNG is used to generate spin outcomes  
**Then** it passes NIST randomness tests  
**And** outcomes are not predictable  
**And** seed management is secure  
**And** entropy pool is maintained

#### SEC-5: Rate Limiting Prevents Abuse
**Given** a user attempts to spin rapidly  
**When** they exceed 100 spins per hour  
**Then** further attempts are blocked  
**And** IP-based limits also apply  
**And** suspicious patterns are flagged

#### SEC-6: Data Encryption
**Given** sensitive data is transmitted  
**Then** TLS 1.3 is used for all API calls  
**And** sensitive data at rest is encrypted with AES-256  
**And** encryption keys are managed securely

#### SEC-7: Security Review Approved
**Given** the slot machine feature is ready for production  
**Then** a security review is completed  
**And** all findings are addressed  
**And** sign-off is documented

### Performance Requirements

#### PERF-1: Spin Latency < 200ms (p95)
**Given** 1000 concurrent users spinning  
**When** latency is measured  
**Then** 95% of spins complete in < 200ms  
**And** 99% complete in < 400ms

#### PERF-2: Handle 1000 Spins/Second
**Given** load test simulates 1000 spins per second  
**When** the test runs for 5 minutes  
**Then** all requests succeed  
**And** error rate < 0.1%  
**And** latency SLA is maintained

#### PERF-3: 99.9% Uptime
**Given** monitoring over 30 days  
**Then** uptime is ≥ 99.9%  
**And** max downtime is < 43 minutes per month  
**And** graceful degradation works during incidents

#### PERF-4: Database Query Optimization
**Given** database queries are analyzed  
**Then** all queries have appropriate indexes  
**And** EXPLAIN ANALYZE shows index usage  
**And** no full table scans on large tables  
**And** query time < 50ms (p95)

#### PERF-5: Load Testing Passed
**Given** load test at 3x expected peak (3000 spins/sec)  
**Then** system remains stable  
**And** auto-scaling works correctly  
**And** no database bottlenecks  
**And** latency degradation < 20%

### Compliance Requirements

#### COMP-1: Age Verification
**Given** a user attempts to access slot machine  
**Then** their age is verified (≥18 years)  
**And** unverified users are blocked  
**And** verification is checked on each session

#### COMP-2: Spending Limits Configurable
**Given** a user wants to set spending limits  
**Then** they can configure daily/weekly limits  
**And** limits are enforced server-side  
**And** attempts to exceed limits are blocked  
**And** spending totals are displayed

#### COMP-3: Terms of Service Acceptance
**Given** a user accesses slot machine for first time  
**Then** they must accept terms of service  
**And** acceptance is recorded with timestamp  
**And** terms version is tracked  
**And** updates require re-acceptance

#### COMP-4: Jurisdictional Restrictions
**Given** a user in a prohibited jurisdiction  
**Then** the slot machine is not accessible  
**And** a message displays "Not available in your region"  
**And** VPN detection is implemented  
**And** jurisdiction list is configurable

#### COMP-5: Fair Gaming Standards
**Given** the slot machine is audited  
**Then** RTP matches advertised rate (±1%)  
**And** RNG is certified fair  
**And** audit results are documented  
**And** configuration is transparent

#### COMP-6: Legal Review Approved
**Given** the slot machine is ready for launch  
**Then** legal team review is completed  
**And** all compliance requirements are met  
**And** approval is documented

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**BLOCKED until specification approved**

- [ ] Backend API scaffold (NestJS/Express)
- [ ] Database schema creation and migrations
- [ ] Authentication integration
- [ ] CSPRNG RNG implementation and testing
- [ ] Basic unit tests

**Deliverables:**
- API skeleton with health check
- Database tables created
- RNG passes NIST tests
- 90% unit test coverage

### Phase 2: Core Functionality (Week 3-4)
**BLOCKED until Phase 1 complete**

- [ ] Loyalty API integration
- [ ] Slot machine spin logic
- [ ] Payout calculation engine
- [ ] Transaction management
- [ ] Idempotency implementation

**Deliverables:**
- Working spin endpoint
- Balance deduction/credit working
- Transaction logging complete
- Integration tests passing

### Phase 3: Security & Compliance (Week 5)
**BLOCKED until Phase 2 complete**

- [ ] Rate limiting implementation
- [ ] Fraud detection rules
- [ ] Audit logging complete
- [ ] Compliance controls (age, jurisdiction)
- [ ] Security testing

**Deliverables:**
- Rate limits enforced
- Audit trail complete
- Security tests passing
- Penetration test results

### Phase 4: Frontend Integration (Week 6-7)
**BLOCKED until Phase 3 complete**

- [ ] UI component development
- [ ] Animation and UX implementation
- [ ] Error handling and user feedback
- [ ] History and analytics views
- [ ] Mobile responsive design

**Deliverables:**
- Functional UI
- Smooth animations
- Error states handled
- Cross-browser tested

### Phase 5: Testing & Validation (Week 8)
**BLOCKED until Phase 4 complete**

- [ ] Comprehensive test suite execution
- [ ] Load and performance testing
- [ ] Security penetration testing
- [ ] Legal and compliance review
- [ ] Stakeholder sign-off

**Deliverables:**
- All tests passing
- Load test results meet SLA
- Security sign-off
- Legal approval

### Phase 6: Deployment (Week 9-10)
**BLOCKED until Phase 5 complete**

- [ ] Staging environment deployment
- [ ] Production deployment planning
- [ ] Monitoring and alerting setup
- [ ] Feature flag configuration
- [ ] Rollout to 10% → 50% → 100% users

**Deliverables:**
- Production deployment successful
- Monitoring dashboards live
- On-call runbook ready
- Post-launch metrics tracking

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RNG not cryptographically secure | High | Low | Use battle-tested CSPRNG library, third-party audit |
| Loyalty API performance bottleneck | Medium | Medium | Implement caching, circuit breaker, retry logic |
| Fraud and abuse | High | Medium | Comprehensive rate limiting, anomaly detection, audit logs |
| Regulatory compliance issues | High | Low | Early legal review, configurable regional controls |
| User addiction concerns | Medium | Medium | Implement spending limits, responsible gaming features |
| Database performance at scale | Medium | Medium | Proper indexing, sharding strategy, query optimization |
| Client-side manipulation | High | Low | Server-authoritative design, signed responses, validation |
| Race conditions in balance updates | High | Medium | Database locking, optimistic concurrency, thorough testing |
| Idempotency key collisions | Medium | Low | Use UUID v4, validate uniqueness, monitor for duplicates |
| Configuration errors cause incorrect payouts | High | Low | Validation logic, simulation testing, approval workflow |

---

## Success Metrics

### Business Metrics
- User engagement rate with slot machine feature (target: 30% of active users)
- Average spins per active user per day (target: 10 spins)
- Loyalty points circulation through slot machine (target: 20% of total points)
- User retention impact (target: +5% week-over-week retention)
- Revenue impact from increased engagement (measured via analytics)

### Technical Metrics
- API latency p50/p95/p99 (target: 50ms / 200ms / 400ms)
- Error rate (target: < 0.1%)
- Throughput (target: 1000 spins/sec sustained)
- System availability (target: 99.9%)
- Database query performance (target: < 50ms p95)

### Security Metrics
- Authentication failure rate (baseline: current rate)
- Rate limit trigger frequency (monitor for abuse patterns)
- Anomaly detection alerts (target: < 10 false positives per day)
- Security incident count (target: zero)

---

## Review and Approval

**This specification must be reviewed and approved by the following stakeholders before implementation:**

- [ ] Product Owner - Feature requirements and business logic
- [ ] Backend Engineering Lead - Technical architecture and feasibility
- [ ] Security Engineer - Security requirements and threat model
- [ ] Database Administrator - Data model and scalability
- [ ] Legal/Compliance - Regulatory compliance and risk assessment
- [ ] DevOps Lead - Deployment strategy and infrastructure requirements

**Approval Status**: Pending Review

---

## Document Control

- **Version**: 1.0
- **Status**: Authoritative - Pending Approval
- **Created**: 2025-12-15
- **Last Updated**: 2025-12-15
- **Next Review**: Upon completion of stakeholder review
- **Approved By**: (pending)

---

## Questions or Clarifications

For questions about this specification:
- Product: product-team@xxxchatnow.com
- Technical: engineering-team@xxxchatnow.com
- Security: security-team@xxxchatnow.com
- Compliance: legal@xxxchatnow.com

---

## References

- [Copilot Engineering Rules](/docs/copilot/COPILOT.md)
- [Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)
- [Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [Original Briefing](/XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md)
