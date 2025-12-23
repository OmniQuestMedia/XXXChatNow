# User Frontend Application

This is the user-facing frontend application built with Next.js and Ant Design.

## Overview

The user application provides the main interface for platform users, including:
- User authentication and profile management
- Content browsing and interaction
- Token-based transactions
- Game features (slot machine, wheel spin)
- Live streaming and chat

## Setup

```bash
cd user
yarn install
cp env.example .env
# Configure environment variables in .env
yarn dev
```

The application will start on port 8081 by default.

## Development

### Linting

```bash
yarn lint
```

### Building

```bash
yarn build
yarn start
```

## Audit Logging Requirements

### When to Log Audit Events

All menu-triggered sensitive operations **MUST** call the audit API before executing. This includes:

#### Required Audit Events

1. **Game Operations**
   - Slot machine spins
   - Wheel spins
   - Any game launches or interactions

2. **Financial/Token Operations**
   - Point redemptions
   - Token purchases (initiation)
   - Token transfers
   - Payout requests

3. **State-Changing Operations**
   - Profile updates with value implications
   - Subscription changes
   - Configuration changes affecting billing

4. **Administrative Actions** (when performed from user context)
   - Role changes
   - Permission modifications
   - Account status changes

#### NOT Required for Audit

- Simple navigation clicks
- Content viewing (videos, profiles)
- Search operations
- Read-only data fetching
- UI state changes (theme, language)

### How to Use Audit Logging

Import and call the `logAuditEvent` function from `src/utils/audit.ts`:

```typescript
import { logAuditEvent } from '@/utils/audit';

// Before executing sensitive operation
async function handleSlotMachineSpin(betAmount: number) {
  // Log the audit event FIRST
  await logAuditEvent('slot-machine-spin', 'games', {
    betAmount // Non-sensitive metadata only
  });
  
  // Then execute the operation
  const result = await slotMachineService.spin(betAmount);
  // ...
}
```

### Security Rules for Audit Logging

**CRITICAL: Never log sensitive data**

❌ **DO NOT LOG:**
- PII (names, emails, addresses, phone numbers)
- Financial values (balances, earnings, exact amounts)
- Authentication credentials (passwords, tokens, API keys)
- Payment details (card numbers, CVV, bank accounts)
- Session tokens or identifiers

✅ **DO LOG:**
- Action type (e.g., 'slot-machine-spin')
- Menu key that triggered the action
- Non-sensitive operation parameters (e.g., bet tier, not exact amount)
- Timestamp (added automatically by API)
- User ID (added automatically from session)

### Audit API Integration

The audit utility automatically:
- Extracts user ID from authenticated session
- Adds server-side timestamp
- Sanitizes metadata to remove sensitive fields
- Handles API failures gracefully (logs error, doesn't block operation)

API Endpoint: `POST /api/audit/event`

Required Authentication: Yes (Bearer token from session)

### Compliance

Audit logging is required for:
- Security compliance
- Financial transaction tracking
- Admin action accountability
- Debugging sensitive operation flows

Missing audit logs for required operations may result in:
- Failed code reviews
- Blocked deployments
- Compliance violations

See `DECISIONS.md` and `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md` for full requirements.

## Architecture

The user application follows these architectural principles:

1. **No Business Logic**: All financial, loyalty, and game logic must be in `/api`
2. **No Local State for Value**: Never store monetary or loyalty values in client state
3. **Server-Side Validation**: All sensitive operations validated server-side
4. **Audit Trail**: All sensitive menu actions must log to audit API

See `ARCHITECTURE.md` and `DECISIONS.md` for detailed guidelines.

## References

- [Contributing Guide](../CONTRIBUTING.md)
- [Security Audit Policy](../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Decisions Log](../DECISIONS.md)
- [Copilot Governance](../COPILOT_GOVERNANCE.md)

