## 2025-12-23
- All financial and loyalty logic must transit through `/api`; UI and admin code must never contain business logic or local state for monetary or loyalty adjudication.
- Slot machine randomization uses only CSPRNG; all spins, outcomes, and rewards are computed server-side, never client-side.
- Absolutely no backdoors, magic credentials, or override flows are permitted under any pretense (production or otherwise).
- OpenAPI/Swagger documentation published from `/api` is the sole source of truth for frontend/backend contracts.
- Production deployments must enforce hardening requirements as laid out in SECURITY_AUDIT_POLICY_AND_CHECKLIST.md.
- All boundary, security, and audit rules supersede convenience or velocity; if there is a conflict, security and auditability win by default.

## Audit Logging Policy (2025-12-23)

### Audit API Coverage Requirement

All menu-triggered sensitive flows in `/user` and `/admin` **MUST** call the audit API endpoint (`POST /api/audit/event`) before execution.

### Sensitive Operations Requiring Audit Logs

Audit logging is **REQUIRED** for operations that:

1. **Affect Value or State**
   - Token/point transactions (purchases, redemptions, transfers)
   - Game operations (slot machine spins, wheel spins, any gambling)
   - Financial operations (payouts, refunds, adjustments)
   - Loyalty program actions (reward claims, tier changes)

2. **Affect Admin Privileges**
   - User role changes
   - Permission grants/revocations
   - Account status modifications (suspend, activate, ban)
   - Configuration changes affecting billing or security

3. **State-Changing Sensitive Flows**
   - Profile updates with financial implications
   - Subscription changes
   - Privacy setting modifications
   - Security setting changes (2FA, password, sessions)

### Operations NOT Requiring Audit Logs

Audit logging is **NOT REQUIRED** for:
- Simple navigation menu clicks
- Content viewing (videos, images, profiles)
- Search and filter operations
- Read-only data fetching
- UI state changes (theme, language, layout)
- Non-sensitive profile views

### Audit Data Requirements

**MUST Include:**
- `action`: Action type identifier (e.g., 'slot-machine-spin', 'redeem-points')
- `menuKey`: Menu identifier that triggered the action (e.g., 'games', 'loyalty')
- `metadata`: Non-sensitive operation context (optional)
- `userId`: Extracted automatically from authenticated session
- `timestamp`: Added automatically by API (server time)

**MUST NOT Include (Security Violation):**
- PII: names, emails, addresses, phone numbers, SSN
- Financial data: balances, earnings, exact monetary amounts
- Credentials: passwords, tokens, API keys, session IDs
- Payment details: card numbers, CVV, bank accounts
- Any other sensitive personal information

### Integration Pattern

```typescript
// user/src/utils/audit.ts provides the integration
import { logAuditEvent } from '@/utils/audit';

// Before executing sensitive operation
await logAuditEvent(
  'action-type',      // Required: action identifier
  'menu-key',         // Optional: menu that triggered it
  { tier: 'premium' } // Optional: non-sensitive metadata
);

// Then execute the actual operation
const result = await sensitiveOperation();
```

### API Structure

**Endpoint:** `POST /api/audit/event`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "action": "slot-machine-spin",
  "menuKey": "games",
  "metadata": {
    "gameType": "standard"
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "507f1f77bcf86cd799439011"
}
```

### Implementation Details

**API Module:** `api/src/modules/audit/`
- `audit.controller.ts`: POST /api/audit/event endpoint
- `audit.service.ts`: Event recording logic (stub implementation)
- `audit.module.ts`: Module registration
- `schemas/audit-event.schema.ts`: MongoDB schema

**User Utility:** `user/src/utils/audit.ts`
- `logAuditEvent()`: Primary function for logging events
- Automatic sanitization of sensitive data
- Graceful error handling (logs but doesn't block)

### Compliance and Enforcement

1. **Code Review Requirement**: All PRs with sensitive operations must include audit logging calls
2. **Security Audit**: Missing audit logs for required operations block deployment
3. **Documentation**: All new sensitive features must document audit requirements
4. **Onboarding**: Developers must review audit policy before implementing sensitive features

### Rationale

- **Security**: Complete audit trail for all sensitive operations
- **Compliance**: Meet regulatory requirements for financial transaction tracking
- **Debugging**: Enable investigation of issues in production
- **Accountability**: Track admin actions and user operations
- **Forensics**: Support incident response and security investigations

### References

- `user/README.md`: Audit integration guide for developers
- `SECURITY_AUDIT_POLICY_AND_CHECKLIST.md`: Security requirements
- `api/src/modules/audit/`: API implementation
- `user/src/utils/audit.ts`: Client integration utility

