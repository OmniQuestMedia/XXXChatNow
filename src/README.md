# RedRoomRewards Source Code

This directory contains the source code for the RedRoomRewards system - an authoritative rewards and value management platform.

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root application module
├── common/                 # Shared utilities and helpers
│   └── utils/
│       └── timezone.util.ts  # Platform timezone utilities (ET/UTC conversion)
├── config/                 # Configuration files
├── database/              # Database migrations and seeds
│   ├── migrations/        # TypeORM migrations
│   └── seeds/             # Database seed data
└── modules/               # Feature modules
    ├── policy/            # Policy configuration system
    ├── token-bundles/     # Token pricing menus
    ├── wallet/            # Token wallet and lot management
    ├── campaigns/         # Campaign engine
    ├── model-dashboard/   # Model marketing dashboard
    ├── emails/            # Email system and templates
    └── audit/             # Audit logging

```

## Module Organization

Each module follows a consistent structure:

```
module-name/
├── entities/              # TypeORM entities (database models)
├── dto/                   # Data Transfer Objects (validation)
├── controllers/           # HTTP controllers (API endpoints)
├── module-name.service.ts # Business logic
└── module-name.module.ts  # Module definition
```

## Development Guidelines

### Timezone Handling

**All campaign times and earnings calculations use Platform Time (America/Toronto, ET).**

- Store dates in database as **UTC**
- Display dates to users as **ET**
- Use utilities from `common/utils/timezone.util.ts`

Example:
```typescript
import { formatET, nowET, toUTC } from '@common/utils/timezone.util';

// Get current time in ET
const currentET = nowET();

// Format for display
const displayTime = formatET(currentET); // "2026-06-01 00:00:00 EDT"

// Convert ET to UTC for database storage
const utcTime = toUTC(currentET);
```

### Token-Based Features

All features involving tokens, earnings, or financial operations **MUST** follow:

1. **Server-authoritative design** - client never determines outcomes
2. **Complete audit logging** - all operations logged immutably
3. **Idempotency** - duplicate requests don't duplicate effects
4. **Integer storage** - use integers for token amounts (not floats)
5. **90%+ test coverage** (100% for token calculations)

See `/docs/copilot/COPILOT.md` for complete rules.

### Security Requirements

- All admin endpoints require authentication and RBAC
- No hardcoded credentials or backdoors
- Use CSPRNG for any random operations
- Never log sensitive data (PII, tokens, credentials)
- All token operations must be audited

See `/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md` for details.

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

Target coverage: 90%+ overall, 100% for token calculations.

## Database

The application uses PostgreSQL with TypeORM.

Entities are automatically discovered from `**/*.entity.ts` files.

In development, `synchronize: true` automatically syncs schema changes.  
In production, use migrations.

## Configuration

Configuration is managed through:

1. **Environment variables** (`.env` file)
2. **Policy configuration system** (database-driven, admin-editable)

Default policies are seeded on first run by the `PolicyService`.

## API Documentation

API endpoints follow RESTful conventions:

- `/api/admin/*` - Admin-only endpoints (require RBAC)
- `/api/model/*` - Model/creator endpoints
- `/api/guest/*` - Guest/user endpoints

See `/docs/specs/TOKEN_PRICING_CAMPAIGNS_SPEC_v1.0.md` for complete API reference.

## Important Notes

- This is **RedRoomRewards only** - do not reference or modify archived XXXChatNow code
- All prices and rates are configurable - no hardcoded financial values
- Platform timezone (ET) governs all campaign timing and reporting
- Follow engineering standards in `/docs/governance/ENGINEERING_STANDARDS.md`
