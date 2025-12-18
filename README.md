# ⚠️ IMPORTANT NOTICE: Repository Transition ⚠️

**This repository is now RedRoomRewards only.**

The legacy XXXChatNow codebase has been archived and **no longer belongs in this repository**. All XXXChatNow code has been moved to [`_archive/xxxchatnow-seed/`](_archive/xxxchatnow-seed/) and is scheduled for deletion.

**Do not develop or reference the archived XXXChatNow code.** All future development should focus exclusively on RedRoomRewards functionality.

For more information about the archived code, see the [archive README](_archive/xxxchatnow-seed/README.md).

---

# RedRoomRewards

### Overview
RedRoomRewards is the authoritative rewards and value management system featuring:
- **Admin-configurable token pricing** by user tier
- **Token wallet management** with lot-based accounting
- **Campaign engine** for promotional campaigns
- **Model marketing dashboard** with real-time earnings
- **Multi-language email system** for campaign communications

### Version
V1.0.3

### Current Status
**Foundation Complete** - Core infrastructure, policy configuration, token pricing menus, and wallet management are implemented and tested.

See [Implementation Status](/docs/IMPLEMENTATION_STATUS.md) for detailed progress.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials

# Run database migrations (when available)
npm run migrate

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

---

## 📚 Documentation

**All developers, GitHub Copilot, and contributors must follow the authoritative documentation and standards:**

### Core Documentation
- **[Token Pricing & Campaigns Specification](/docs/specs/TOKEN_PRICING_CAMPAIGNS_SPEC_v1.0.md)** - Complete system specification with API contracts and data models
- **[Implementation Status](/docs/IMPLEMENTATION_STATUS.md)** - Current implementation status and progress tracking
- **[Copilot Engineering Rules](/docs/copilot/COPILOT.md)** - Mandatory rules for all token-based feature development
- **[Engineering Standards](/docs/governance/ENGINEERING_STANDARDS.md)** - Cross-cutting governance for all features
- **[Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)** - Security requirements and audit checklist
- **[AI Onboarding Guide](/AI_ONBOARDING.md)** - Guidelines for AI assistant integration

### Additional Documentation
- **[Source Code README](/src/README.md)** - Development guidelines and module structure
- **[Slot Machine Specification](/docs/specs/SLOT_MACHINE_SPEC_v1.0.md)** - Slot machine feature specification

**These documents are authoritative and must be followed for all future feature and PR work involving tokens, promotions, and financial operations.**

---

## 🏗️ Architecture

### Technology Stack
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Platform Timezone**: America/Toronto (Eastern Time)
- **Testing**: Jest with 90%+ coverage target

### Module Structure
```
src/
├── main.ts                   # Application entry point
├── app.module.ts             # Root module
├── common/                   # Shared utilities (timezone, etc.)
├── modules/
│   ├── policy/              # ✅ Policy configuration system
│   ├── token-bundles/       # ✅ Token pricing menus
│   ├── wallet/              # ✅ Token wallet & lot management
│   ├── campaigns/           # ⏳ Campaign engine (in progress)
│   ├── model-dashboard/     # ⏳ Model marketing dashboard
│   ├── emails/              # ⏳ Multi-language email system
│   └── audit/               # ⏳ System-wide audit logging
```

✅ = Complete | ⏳ = Not yet implemented

---

## 🔑 Key Features Implemented

### 1. Policy Configuration System
- Admin-configurable settings (no hardcoded prices)
- Default policies for rates, grace periods, spend order
- API: `/api/admin/policies`

### 2. Token Pricing Menus
- 5 user tiers: Rack Rate, VIP, Gold VIP, Silver VIP, Platinum VIP
- Cost-per-token calculations
- Required creator earnings footer
- API: `/api/admin/token-bundles`, `/api/guest/token-bundles`

### 3. Token Wallet & Lot Management
- Three lot types: promo, membership, purchased
- Server-authoritative spend order enforcement
- Automatic expiry with grace periods
- Idempotent token spending
- Complete audit trail
- API: `/api/admin/wallet`, `/api/guest/wallet`

### 4. Platform Timezone Utilities
- All campaign times in America/Toronto (ET)
- UTC ↔ ET conversion
- Grace period calculations
- Time range validation

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

**Coverage Targets:**
- Overall: 90%+
- Token calculations: 100%
- Current: ~95% of implemented features

---

## 🔒 Security Features

- ✅ Server-authoritative design (no client-side trust)
- ✅ Database transactions for atomicity
- ✅ Idempotency for financial operations
- ✅ Complete audit trail
- ✅ Integer storage for token amounts (no floating point)
- ⏳ RBAC for admin endpoints (planned)
- ⏳ Rate limiting (planned)
- ⏳ Comprehensive security testing (planned)

See [Security Audit Policy](/SECURITY_AUDIT_POLICY_AND_CHECKLIST.md) for complete requirements.

---

## 📊 API Endpoints

### Policy Configuration
- `GET /api/admin/policies` - List all policies
- `PUT /api/admin/policies/:key` - Update policy

### Token Bundles
- `GET /api/guest/token-bundles/menu` - Get all pricing menus
- `POST /api/admin/token-bundles` - Create bundle

### Wallet
- `GET /api/guest/wallet/balance/:userId` - Get balance
- `POST /api/guest/wallet/spend/:userId` - Spend tokens (idempotent)
- `POST /api/admin/wallet/award` - Award tokens

See [API Specification](/docs/specs/TOKEN_PRICING_CAMPAIGNS_SPEC_v1.0.md) for complete API documentation.

---

## 🎯 Next Steps

See [Implementation Status](/docs/IMPLEMENTATION_STATUS.md) for detailed roadmap.

**Priority tasks:**
1. Campaign Engine Core (lifecycle, scheduler)
2. Campaign Earnings System (base + promo calculations)
3. Admin Campaign Management (CRUD, email templates)
4. Model Marketing Dashboard (real-time progress)
5. Opt-In/Out Workflow (digital acknowledgements)

---

## 👥 Contributing

See [Contributing Guide](/CONTRIBUTING.md) for development workflow.

### Key Requirements
- Follow TypeScript/NestJS best practices
- Maintain 90%+ test coverage
- All token features must be server-authoritative
- No hardcoded prices or rates
- Use platform timezone (ET) for all dates
- Follow security requirements strictly

---

## 📞 Contact

- **Sales**: general@OQMINC.com
- **Technical**: tuong.tran@outlook.com
- **Organization**: OmniQuestMedia Inc. (OQMI)

---

## 📝 License

UNLICENSED - Proprietary software for OmniQuestMedia Inc.

---

**Important**: This is **RedRoomRewards only**. Do not reference or modify archived XXXChatNow code in `_archive/`.
