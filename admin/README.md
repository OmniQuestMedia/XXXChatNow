# Admin Panel Application

This is the administrative panel application built with Next.js and Ant Design.

## Overview

The admin panel provides comprehensive management capabilities including:
- User and performer management
- Content moderation
- Financial operations (payouts, refunds, adjustments)
- System configuration
- Analytics and reporting
- Audit log review

## Setup

```bash
cd admin
yarn install
cp env.example .env
# Configure environment variables in .env
yarn dev
```

The application will start on the configured port.

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

All admin menu-triggered sensitive operations **MUST** call the audit API before execution. Admin operations have heightened audit requirements due to privileged access.

#### Required Audit Events

1. **User Management**
   - User/performer suspension or bans
   - Role changes or permission grants
   - Account status modifications
   - Password resets initiated by admin
   - Profile modifications with value implications

2. **Financial Operations**
   - Payout approvals/rejections
   - Refund processing
   - Manual balance adjustments
   - Commission modifications
   - Token grants or deductions

3. **System Configuration**
   - Payment gateway settings
   - Security configuration changes
   - Feature flag changes
   - Rate limit adjustments
   - Any configuration affecting billing or security

4. **Content Moderation**
   - Content takedowns
   - Account restrictions
   - Community guideline violations

#### NOT Required for Audit

- Simple data queries and reports
- Content viewing (non-moderation)
- Navigation menu clicks
- UI state changes

### How to Use Audit Logging

Import and call the `logAuditEvent` function from `src/utils/audit.ts`:

```typescript
import { logAuditEvent } from '@/utils/audit';

// Before executing sensitive admin operation
async function handleUserSuspension(userId: string, reason: string) {
  // Log the audit event FIRST
  await logAuditEvent('admin-suspend-user', 'admin-users', {
    action: 'suspend',
    reason: 'policy-violation' // Non-specific metadata only
  });
  
  // Then execute the operation
  const result = await userService.suspendUser(userId, reason);
  // ...
}
```

### Security Rules for Audit Logging

**CRITICAL: Never log sensitive data**

❌ **DO NOT LOG:**
- PII: names, emails, addresses, phone numbers, user IDs
- Financial data: balances, earnings, exact amounts
- Credentials: passwords, tokens, API keys
- IP addresses or session identifiers
- Payment details

✅ **DO LOG:**
- Action type (e.g., 'admin-suspend-user')
- Menu key that triggered the action
- Non-specific operation context (e.g., 'status-change', not the actual values)
- Timestamp (added automatically by API)
- Admin user ID (added automatically from session)

### Admin Accountability

Admin audit logs serve critical compliance and security functions:
- **Accountability**: Track all privileged operations
- **Forensics**: Investigate security incidents
- **Compliance**: Meet regulatory requirements
- **Training**: Review admin workflows
- **Dispute Resolution**: Resolve user complaints

Missing audit logs for admin operations may result in:
- Immediate investigation
- Access revocation
- Failed compliance audits
- Security policy violations

### Audit API Integration

The audit utility automatically:
- Extracts admin user ID from authenticated session
- Adds server-side timestamp
- Sanitizes metadata to remove sensitive fields
- Handles API failures gracefully (logs error, doesn't block operation)

API Endpoint: `POST /api/audit/event`

Required Authentication: Yes (Admin Bearer token from session)

## Architecture

The admin panel follows strict architectural principles:

1. **No Business Logic**: All financial, loyalty, and game logic must be in `/api`
2. **No Direct Database Access**: All data operations through API endpoints
3. **Privileged Access Control**: Admin operations require role verification
4. **Complete Audit Trail**: All sensitive admin actions must log to audit API

See `ARCHITECTURE.md` and `DECISIONS.md` for detailed guidelines.

## References

- [Contributing Guide](../CONTRIBUTING.md)
- [Security Audit Policy](../SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Decisions Log](../DECISIONS.md)
- [Copilot Governance](../COPILOT_GOVERNANCE.md)

