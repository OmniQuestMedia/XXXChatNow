# Token Pricing, Fair Pay Promotions, Campaign Engine Specification

**Version**: 1.0  
**Status**: Authoritative  
**Created**: 2025-12-18  
**Platform Timezone**: America/Toronto (Eastern Time, ET)  
**Scope**: Token pricing menus, wallet management, campaign engine, model marketing dashboard

---

## Executive Summary

This specification defines a comprehensive, admin-configurable token pricing and promotional campaign system for RedRoomRewards. The system enables:

- **Flexible token pricing** by user tier with no hardcoded prices
- **Token wallet management** with lot-based accounting to prevent stockpiling
- **Campaign engine** supporting multiple concurrent scheduled campaigns
- **Model marketing dashboard** with real-time earnings tracking
- **Opt-in/out workflow** with digital acknowledgements
- **Multi-language email system** for campaign communications

All campaign timing and earnings calculations use Platform Time (America/Toronto, ET).

---

## Key Business Rules

### Creator Earnings Promise
- **Base rate**: Minimum $0.065 credited per token
- **Promo rate**: Up to $0.075 per token during campaigns
- **Ambassador rate**: $0.080 per token (excluded from promo lifts)
- **Transparency**: Models see real-time breakdown of base + promo earnings

### Token Wallet Philosophy
- Tokens are organized in **lots** by source (promo, membership, purchased)
- **Spend order** prevents stockpiling: promo → membership → purchased
- **Expiry rules** with 24-hour grace periods limit promotional exposure
- Server-authoritative balance tracking with complete audit trail

### Campaign System
- **Multiple concurrent campaigns** supported
- **Yearly versioning** - campaigns can be cloned year-to-year
- **Automatic lifecycle** - scheduled campaigns activate and end automatically
- **Platform Time governance** - all times in ET, stored as UTC
- **T-14 preview** - models see campaigns 14 days before start

---

## 1. Policy Configuration System

### Admin-Configurable Settings

All pricing and campaign policies are stored in a database configuration table and editable by super admins.

#### Policy Configuration Schema

```typescript
interface PolicyConfiguration {
  id: string;
  key: string;                    // Unique policy key
  value: any;                     // JSON value (string, number, object)
  description: string;            // Human-readable description
  category: string;               // Group (pricing, campaigns, wallet, etc.)
  editable_by: string[];          // Roles that can edit
  last_modified: Date;
  modified_by: string;
  version: number;
}
```

#### Default Policy Values

| Key | Value | Category | Description |
|-----|-------|----------|-------------|
| `platform_timezone` | "America/Toronto" | system | Platform timezone for all operations |
| `weekly_cutoff` | "Monday 06:00 ET" | reporting | Weekly earnings cutoff time |
| `creator_base_rate_per_token` | 0.065 | pricing | Minimum credited per token |
| `creator_promo_max_rate_per_token` | 0.075 | pricing | Maximum promo target rate |
| `creator_ambassador_rate_per_token` | 0.080 | pricing | Ambassador contract rate |
| `ambassador_excluded_from_promo_lifts` | true | campaigns | Exclude ambassadors from promos |
| `promo_grace_hours` | 24 | wallet | Grace period for promo token expiry |
| `token_spend_order` | ["promo_bonus", "membership_monthly", "purchased"] | wallet | Enforced spend order |
| `rack_rate_promo_eligible` | false | campaigns | Rack rate users get promos |
| `promo_month_budget_percent` | 0.70 | campaigns | Budget as % of membership revenue |
| `promo_budget_cap_percent` | 0.60 | campaigns | Maximum % of membership revenue for promotional budget (retaining 40% for OQMI) |
| `promo_max_bonus_tokens_vip` | 100 | campaigns | Maximum bonus tokens per VIP member during promotion |
| `promo_max_bonus_tokens_gold_vip` | 250 | campaigns | Maximum bonus tokens per Gold VIP member during promotion |
| `promo_max_bonus_tokens_silver_vip` | 150 | campaigns | Maximum bonus tokens per Silver VIP member during promotion |
| `promo_max_bonus_tokens_platinum_vip` | 500 | campaigns | Maximum bonus tokens per Platinum VIP member during promotion |
| `membership_monthly_revenue_vip` | 999 | pricing | Monthly membership revenue per VIP user (cents) |
| `membership_monthly_revenue_gold_vip` | 1999 | pricing | Monthly membership revenue per Gold VIP user (cents) |
| `membership_monthly_revenue_silver_vip` | 1499 | pricing | Monthly membership revenue per Silver VIP user (cents) |
| `membership_monthly_revenue_platinum_vip` | 2999 | pricing | Monthly membership revenue per Platinum VIP user (cents) |

### API Endpoints

```
GET    /api/admin/policies                           - List all policies
GET    /api/admin/policies/:key                      - Get specific policy
PUT    /api/admin/policies/:key                      - Update policy (audit logged)
POST   /api/admin/policies/validate                  - Validate policy changes
GET    /api/admin/policies/:key/history              - Get policy change history
GET    /api/admin/policies/campaign-budget/tier/:tier - Calculate promotional budget for tier
POST   /api/admin/policies/campaign-budget/aggregate  - Calculate aggregated budget across tiers
POST   /api/admin/policies/campaign-budget/validate   - Validate promotion budget constraints
```

### Campaign Budget Calculation

The system provides automatic budget calculations based on membership revenue and configurable promotional caps:

#### Budget Constraints
- **60% Budget Cap**: Maximum 60% of membership revenue can be allocated to promotional bonuses
- **40% Revenue Retention**: Minimum 40% of membership revenue is retained for OQMI
- **Per-Tier Limits**: Each tier has configurable maximum bonus token amounts

#### Tier Budget Example (VIP)
```typescript
{
  tier: "vip",
  membershipRevenue: 999,        // $9.99/month in cents
  maxBudgetPerUser: 599,          // 60% = $5.99
  maxBonusTokens: 100,            // Configurable limit
  estimatedTokenValue: 650,       // 100 tokens * $0.065 * 100 = $6.50
  retainedRevenue: 400,           // 40% = $4.00
  retainedRevenuePercent: 40.04
}
```

#### Aggregated Budget Calculation
The system can calculate total promotional costs across all tiers:

```typescript
POST /api/admin/policies/campaign-budget/aggregate
{
  "userCountByTier": {
    "vip": 100,
    "gold_vip": 50,
    "silver_vip": 75,
    "platinum_vip": 25
  }
}

Response:
{
  "totalEstimatedUsers": 250,
  "totalPromotionCost": 300625,      // $3,006.25 total cost
  "totalRetainedRevenue": 120000,    // $1,200.00 retained
  "averageCostPerUser": 1202.5,      // $12.03 per user
  "averageRetainedPerUser": 480,     // $4.80 per user
  "tierBreakdown": [ /* individual tier budgets */ ]
}
```

#### Budget Validation
Before awarding promotional tokens, validate against budget constraints:

```typescript
POST /api/admin/policies/campaign-budget/validate
{
  "tier": "vip",
  "bonusTokens": 50
}

Response:
{
  "valid": true
}

// OR if exceeding limits:
{
  "valid": false,
  "message": "Bonus tokens (150) exceed maximum allowed for vip tier",
  "maxAllowed": 100
}
```

---

## 2. Token Pricing Menus

### User Tiers

1. **Rack Rate** (non-member) - No promotional bonuses
2. **VIP Guest** - Standard membership
3. **Gold VIP Guest** - Premium membership
4. **Silver VIP Guest** - Mid-tier membership
5. **Platinum VIP Guest** - Elite membership

### Token Bundle Schema

```typescript
interface TokenBundle {
  id: string;
  tier: UserTier;
  tokens: number;                 // Number of tokens in bundle
  price_usd: number;              // Price in USD cents (integer)
  sort_order: number;             // Display order
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

enum UserTier {
  RACK_RATE = 'rack_rate',
  VIP = 'vip',
  GOLD_VIP = 'gold_vip',
  SILVER_VIP = 'silver_vip',
  PLATINUM_VIP = 'platinum_vip'
}
```

### Menu Display Calculations

For each menu (per tier):
- **Cost per token** = price / tokens (display in cents)
- **Highest cost per token** = max(all bundles in tier)
- **Lowest cost per token** = min(all bundles in tier)
- **Blended average** = weighted average based on admin config

### Required Footer Statement

Every token menu must display:

> **Creator Earnings**: Models are credited a minimum of $0.065 per token received, regardless of bundle price. During promotions, bonus credits may be added separately.

### API Endpoints

```
GET    /api/guest/token-bundles/:tier   - Get bundles for tier
GET    /api/guest/token-bundles/menu    - Get full menu with calculations

POST   /api/admin/token-bundles         - Create bundle
PUT    /api/admin/token-bundles/:id     - Update bundle
DELETE /api/admin/token-bundles/:id     - Deactivate bundle
GET    /api/admin/token-bundles         - List all bundles (all tiers)
```

---

## 3. Token Wallet & Lot Management

### Token Lot Types

```typescript
enum TokenLotType {
  PROMO_BONUS = 'promo_bonus',           // Campaign promo tokens
  MEMBERSHIP_MONTHLY = 'membership_monthly', // Monthly membership tokens
  PURCHASED = 'purchased'                 // Cash-purchased tokens
}

interface TokenLot {
  id: string;
  user_id: string;
  lot_type: TokenLotType;
  tokens: number;                        // Current balance in lot
  original_tokens: number;               // Original amount
  source_id: string;                     // Campaign ID, purchase ID, etc.
  awarded_at: Date;
  expires_at: Date;
  grace_expires_at: Date;                // expires_at + grace hours
  expired: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Spend Order Enforcement

**Server-side only** - clients cannot override spend order.

1. **Promo bonus tokens** - Spent first (oldest expiry first)
2. **Membership monthly tokens** - Spent second (oldest expiry first)
3. **Purchased tokens** - Spent last (oldest expiry first)

### Expiry Rules

#### Promo Tokens
- **Awarded**: Campaign start (or specific award time)
- **Expires**: Campaign end date
- **Grace**: +24 hours (configurable)
- **After grace**: Balance → 0 (audit logged)

#### Membership Monthly Tokens
- **Awarded**: Start of membership month
- **Expires**: End of membership month
- **Grace**: +24 hours
- **After grace**: Balance → 0 (audit logged)

#### Purchased Tokens
- **Expiry**: Per tier rules at time of purchase
- **Upgrade**: Does NOT extend existing purchased tokens
- **Downgrade**: Converts remaining tokens to shorter duration at renewal

### Token Spend Transaction

```typescript
interface TokenSpendTransaction {
  id: string;
  user_id: string;
  amount: number;
  purpose: string;                       // 'tip', 'purchase_service', etc.
  lots_used: TokenLotUsage[];
  idempotency_key: string;
  created_at: Date;
  session_id: string;
  ip_address: string;
}

interface TokenLotUsage {
  lot_id: string;
  tokens_used: number;
  lot_type: TokenLotType;
}
```

### API Endpoints

```
GET    /api/guest/wallet/balance         - Get total balance + breakdown
POST   /api/guest/wallet/spend           - Spend tokens (idempotent)
GET    /api/guest/wallet/lots            - List active lots
GET    /api/guest/wallet/transactions    - Transaction history

POST   /api/admin/wallet/award           - Award tokens (campaign, promo)
POST   /api/admin/wallet/expire          - Manually expire lot
GET    /api/admin/wallet/audit/:user_id  - Full audit trail
```

---

## 4. Campaign Engine

### Campaign Lifecycle

```
draft → scheduled → active → ended → archived
```

- **Draft**: Being edited, not visible to models
- **Scheduled**: Locked, visible 14 days before start (if eligible)
- **Active**: Currently running, tokens awarded, earnings tracked
- **Ended**: Completed, no new earnings, grace period for token usage
- **Archived**: Historical record, read-only

### Campaign Schema

```typescript
interface Campaign {
  id: string;
  key: string;                           // e.g., 'pride-2026'
  year: number;
  name: string;
  description: string;
  notes: string;                         // Admin notes (not visible to models)
  
  // Timing (stored as UTC, displayed in ET)
  start_date: Date;
  end_date: Date;
  opt_in_window_start: Date;
  opt_in_window_end: Date;
  preview_days: number;                  // Default 14
  grace_hours: number;                   // Default 24
  
  // Eligibility
  eligible_tiers: UserTier[];
  requires_opt_in: boolean;
  
  // Creator earnings
  base_rate: number;                     // From policy or override
  target_rate: number;                   // Promo target (e.g., 0.0725)
  final_weekend_spike_rate?: number;     // Optional spike rate
  final_weekend_start?: Date;
  
  // VIP token drops
  vip_token_drops: Record<UserTier, number>;
  
  // Budget & throttling
  budget_cap_usd?: number;
  budget_used_usd: number;
  throttle_enabled: boolean;
  throttle_percent?: number;
  
  // State
  status: CampaignStatus;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  
  // Email templates
  email_templates: EmailTemplate[];
}

enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  ARCHIVED = 'archived'
}
```

### Campaign Transitions

Automatic transitions handled by scheduler:

1. **scheduled → active**: When current time (ET) >= start_date
2. **active → ended**: When current time (ET) >= end_date
3. **Token expiry trigger**: ended + grace_hours

### Yearly Versioning & Cloning

- Campaigns are versioned by year in the `key` field (e.g., `pride-2026`)
- **Clone** action creates new campaign with:
  - New year in key (e.g., `pride-2026` → `pride-2027`)
  - Copied configuration (rates, tiers, token drops)
  - Dates shifted to new year
  - Status reset to `draft`
  - Notes copied
  - Email templates copied

### Pride Campaign Template

Example configuration for canonical Pride campaign:

```json
{
  "key": "pride-2026",
  "year": 2026,
  "name": "Pride Month Celebration",
  "description": "Celebrate Pride with bonus earnings!",
  "start_date": "2026-06-01T00:00:00-04:00",
  "end_date": "2026-06-30T23:59:59-04:00",
  "target_rate": 0.0725,
  "final_weekend_spike_rate": 0.075,
  "final_weekend_start": "2026-06-27T00:00:00-04:00",
  "eligible_tiers": ["vip", "gold_vip", "silver_vip", "platinum_vip"],
  "requires_opt_in": true,
  "vip_token_drops": {
    "vip": 100,
    "gold_vip": 250,
    "silver_vip": 150,
    "platinum_vip": 500
  }
}
```

### API Endpoints

```
GET    /api/admin/campaigns              - List campaigns (filter by year, status)
POST   /api/admin/campaigns              - Create campaign
GET    /api/admin/campaigns/:id          - Get campaign details
PUT    /api/admin/campaigns/:id          - Update campaign (draft only)
DELETE /api/admin/campaigns/:id          - Delete campaign (draft only)
POST   /api/admin/campaigns/:id/clone    - Clone to new year
POST   /api/admin/campaigns/:id/schedule - Lock and schedule
POST   /api/admin/campaigns/:id/archive  - Archive campaign
POST   /api/admin/campaigns/:id/preview-email - Preview email template
```

---

## 5. Model Marketing Dashboard

### Dashboard Sections

1. **Platform Time Display**: Always show current ET time
2. **Upcoming Campaigns**: Shown T-14 days before start
3. **Live Campaigns**: Real-time progress and earnings
4. **Ended Campaigns**: Final totals and summaries

### Upcoming Campaign Card

Display when: `current_time_et >= campaign.start_date - 14 days` and status is `scheduled`

**Information shown**:
- Campaign name and description
- Start and end dates (ET)
- Duration (days)
- Base rate (e.g., $0.065)
- Promo lift (e.g., +$0.0075)
- Total effective rate (e.g., $0.0725)
- VIP token drop amount (if applicable)
- Opt-in status and controls (if requires_opt_in)

### Live Campaign Panel

Display when: campaign status is `active`

**Real-time calculations**:
```typescript
interface LiveCampaignProgress {
  campaign_id: string;
  campaign_name: string;
  
  // Time
  start_date: Date;              // ET
  end_date: Date;                // ET
  time_remaining: string;        // "5 days 3 hours"
  
  // Earnings
  eligible_tokens: number;       // Tokens earned during campaign window
  base_earnings: number;         // tokens * base_rate
  promo_bonus_earnings: number;  // tokens * lift_amount
  total_earnings: number;        // base + promo
  
  // Progress
  days_active: number;
  days_remaining: number;
  progress_percent: number;
}
```

**Calculation logic**:
- Query all token transactions in campaign window where `created_at >= campaign.start_date AND created_at <= campaign.end_date`
- Sum tokens → `eligible_tokens`
- `base_earnings = eligible_tokens * campaign.base_rate`
- `lift = campaign.target_rate - campaign.base_rate`
- `promo_bonus_earnings = eligible_tokens * lift`
- `total_earnings = base_earnings + promo_bonus_earnings`

### Ended Campaign Summary

Display when: campaign status is `ended` or `archived`

**Information shown**:
- Campaign name and dates
- Total eligible tokens
- Base earnings
- Promo bonus earnings
- Total earnings
- **Download CSV** button for detailed breakdown

### API Endpoints

```
GET    /api/model/campaigns              - List campaigns (upcoming, live, ended)
GET    /api/model/campaigns/:id          - Get specific campaign details
GET    /api/model/campaigns/:id/progress - Get live progress (live campaigns only)
GET    /api/model/campaigns/:id/summary  - Get final summary (ended campaigns)
POST   /api/model/campaigns/:id/export   - Export CSV summary
```

---

## 6. Opt-In/Out Workflow

### Digital Acknowledgement System

When a campaign requires opt-in, models must digitally acknowledge their decision.

#### Acknowledgement Schema

```typescript
interface CampaignAcknowledgement {
  id: string;
  model_id: string;
  campaign_id: string;
  decision: 'opt_in' | 'opt_out';
  agreement_version: string;           // Hash of agreement text
  agreement_text: string;              // Full text shown to model
  acknowledged_at: Date;               // ET timestamp
  ip_address: string;
  user_agent: string;
  signature_data: string;              // JSON of form data
}
```

#### Acknowledgement Process

1. Model views campaign on Marketing tab
2. Clicks "Opt In" or "Opt Out"
3. Reads agreement text
4. Checks "I acknowledge and agree" checkbox
5. Clicks "Sign and Submit"
6. System records:
   - Decision
   - Timestamp (ET)
   - Agreement version hash
   - IP and user agent
   - Full agreement text

#### Email Confirmation

Immediately after signing, send confirmation email in model's preferred language:

**Subject**: "Your [Campaign Name] Participation Confirmed"

**Body**:
```
Hi [Model Name],

You have successfully opted [in/out] of the [Campaign Name] campaign.

Campaign Details:
- Start: [start_date ET]
- End: [end_date ET]
- Your Decision: [Opted In / Opted Out]
- Signed: [timestamp ET]

[If opted in:]
You will start earning bonus credits during this campaign. Track your progress on your Marketing Dashboard.

[If opted out:]
You will not receive bonus credits during this campaign. You can view other available campaigns on your Marketing Dashboard.

View Campaign: [deep link to Marketing tab]

Questions? Contact support@xxxchatnow.com
```

### Reminder Email System

For campaigns requiring opt-in, send reminders to models who haven't responded.

#### Day 8 Reminder

**Trigger**: 7 days after opt-in window opens, no acknowledgement recorded

**Subject**: "Reminder: [Campaign Name] Opt-In Window Closing Soon"

**Body**:
```
Hi [Model Name],

The opt-in window for [Campaign Name] is open and closing soon.

Campaign Start: [start_date ET]
Opt-In Deadline: [opt_in_window_end ET]

Don't miss out on bonus earnings! Make your decision today.

Opt In Now: [deep link to Marketing tab]

Questions? Contact support@xxxchatnow.com
```

#### Final Reminder (T-24 hours)

**Trigger**: 24 hours before opt-in window closes, no acknowledgement recorded

**Subject**: "Final Reminder: [Campaign Name] Opt-In Closes Tomorrow"

**Body**:
```
Hi [Model Name],

This is your final reminder! The opt-in window for [Campaign Name] closes in 24 hours.

Opt-In Deadline: [opt_in_window_end ET]

Make your decision before it's too late!

Opt In Now: [deep link to Marketing tab]

Questions? Contact support@xxxchatnow.com
```

### End of Campaign Summary Email

**Trigger**: Campaign ends (or after grace period)

**Subject**: "[Campaign Name] - Your Earnings Summary"

**Body**:
```
Hi [Model Name],

The [Campaign Name] campaign has ended. Here's your earnings summary:

Campaign Period: [start_date] - [end_date] (ET)

Earnings Breakdown:
- Eligible Tokens: [tokens]
- Base Earnings: $[base_earnings]
- Promo Bonus: $[promo_earnings]
- Total Earnings: $[total_earnings]

View Full Details: [deep link to Marketing tab]

Thank you for participating!
```

### API Endpoints

```
POST   /api/model/campaigns/:id/acknowledge  - Submit opt-in/out decision
GET    /api/model/campaigns/:id/acknowledgement - Get acknowledgement status
```

---

## 7. Multi-Language Email System

### Language Preference

Each model profile stores a preferred language using IETF language tags.

```typescript
interface ModelProfile {
  id: string;
  // ... other fields
  preferred_language: string;    // e.g., 'en', 'fr-CA', 'es', 'pt-BR', 'ru'
}
```

### Email Template Schema

```typescript
interface EmailTemplate {
  id: string;
  campaign_id: string;
  type: EmailType;
  language: string;              // IETF language tag
  subject: string;
  body: string;                  // Supports template variables
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

enum EmailType {
  OPT_IN_OPEN = 'opt_in_open',
  CONFIRMATION = 'confirmation',
  REMINDER_DAY_8 = 'reminder_day_8',
  FINAL_REMINDER = 'final_reminder',
  END_SUMMARY = 'end_summary'
}
```

### Template Variables

All email templates support these variables:

- `{{model_name}}` - Model's display name
- `{{campaign_name}}` - Campaign name
- `{{start_date_et}}` - Campaign start (ET)
- `{{end_date_et}}` - Campaign end (ET)
- `{{opt_in_deadline_et}}` - Opt-in deadline (ET)
- `{{decision}}` - "Opted In" or "Opted Out"
- `{{signed_at_et}}` - Acknowledgement timestamp (ET)
- `{{eligible_tokens}}` - Tokens earned
- `{{base_earnings}}` - Base earnings amount
- `{{promo_earnings}}` - Promo bonus amount
- `{{total_earnings}}` - Total earnings
- `{{deep_link}}` - Direct link to Marketing tab

### Language Selection Logic

When sending email:

1. Get model's `preferred_language`
2. Query email templates for campaign + type + language
3. If found: Use template
4. If not found: Fall back to English (`en`)
5. If English not found: Log error, use system default
6. Replace template variables with actual values
7. Send email

### Translation Workflow (Optional v1)

Admin campaign editor provides:

1. **Create template in English** (required)
2. **Translate button** for each additional language
   - Calls automated translation service
   - Pre-fills template in target language
3. **Manual review and edit** before saving
4. **Save** translated template

Supported languages (initial):
- `en` - English (required)
- `fr-CA` - Canadian French
- `es` - Spanish
- `pt-BR` - Brazilian Portuguese
- `ru` - Russian

### API Endpoints

```
GET    /api/admin/campaigns/:id/emails           - List email templates
POST   /api/admin/campaigns/:id/emails           - Create email template
PUT    /api/admin/campaigns/:id/emails/:email_id - Update email template
POST   /api/admin/campaigns/:id/emails/:email_id/translate - Auto-translate
GET    /api/admin/campaigns/:id/emails/preview   - Preview with sample data
```

---

## 8. Campaign Earnings Ledger

### Earnings Tracking

All campaign-related earnings are tracked in a separate ledger for transparency and auditability.

```typescript
interface CampaignEarningsEntry {
  id: string;
  model_id: string;
  campaign_id: string;
  transaction_id: string;         // Link to token transaction
  
  // Token info
  tokens: number;
  token_source: string;           // Who sent the tokens
  
  // Earnings breakdown
  base_rate: number;              // Rate used for base
  base_earnings: number;          // tokens * base_rate
  promo_lift_rate: number;        // Lift above base
  promo_earnings: number;         // tokens * promo_lift_rate
  total_earnings: number;         // base + promo
  
  // Timing
  earned_at: Date;                // When tokens were received (ET)
  campaign_day: number;           // Day of campaign (1-based)
  
  // Audit
  created_at: Date;
  idempotency_key: string;
}
```

### Earnings Calculation Logic

When model receives tokens during active campaign:

1. Check if campaign is active
2. Check if model is eligible (tier, opted in if required)
3. Check if model is ambassador (exclude from lift if policy says so)
4. Determine applicable rates:
   - `base_rate` from policy or campaign
   - `target_rate` from campaign
   - `lift_rate = target_rate - base_rate`
5. Calculate earnings:
   - `base_earnings = tokens * base_rate`
   - `promo_earnings = tokens * lift_rate` (if eligible)
   - `total_earnings = base_earnings + promo_earnings`
6. Create earnings entry (idempotent)
7. Update campaign `budget_used_usd`
8. Check budget cap and throttle if needed

### Ambassador Exclusion Logic

```typescript
function calculateCampaignEarnings(
  tokens: number,
  campaign: Campaign,
  model: Model
): EarningsBreakdown {
  const baseRate = campaign.base_rate;
  const targetRate = campaign.target_rate;
  
  // Check if model is ambassador
  if (model.contract_type === 'ambassador') {
    const ambassadorRate = getPolicyValue('creator_ambassador_rate_per_token');
    const excludeFromPromo = getPolicyValue('ambassador_excluded_from_promo_lifts');
    
    if (excludeFromPromo && ambassadorRate >= targetRate) {
      // Ambassador already above promo rate, no lift
      return {
        base_earnings: tokens * ambassadorRate,
        promo_earnings: 0,
        total_earnings: tokens * ambassadorRate
      };
    }
  }
  
  // Regular model or ambassador below promo rate
  const liftRate = targetRate - baseRate;
  return {
    base_earnings: tokens * baseRate,
    promo_earnings: tokens * liftRate,
    total_earnings: tokens * targetRate
  };
}
```

---

## 9. Security & Audit Requirements

### RBAC (Role-Based Access Control)

#### Roles
- `super_admin` - Full access to all admin endpoints
- `campaign_manager` - Create/edit campaigns, manage emails
- `finance_admin` - View financial reports, audit trails
- `model` - Access own marketing dashboard, opt-in/out
- `guest` - View token menus, spend tokens

#### Admin Endpoint Protection

All `/api/admin/*` endpoints require:
- Valid authentication token
- Role check (super_admin or campaign_manager)
- Audit logging of access

### Audit Logging

All operations must be audited:

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user_id: string;
  role: string;
  action: string;              // 'create_campaign', 'update_policy', etc.
  resource_type: string;       // 'campaign', 'policy', 'wallet', etc.
  resource_id: string;
  changes: any;                // JSON diff of changes
  ip_address: string;
  user_agent: string;
  session_id: string;
}
```

### Idempotency

All token operations must support idempotency keys:

```typescript
interface IdempotentRequest {
  idempotency_key: string;     // Client-provided UUID
  user_id: string;
  operation: string;
  params: any;
  result?: any;
  created_at: Date;
  expires_at: Date;            // 24 hours
}
```

**Logic**:
1. Client provides `Idempotency-Key` header
2. Server checks if key exists and not expired
3. If exists: Return cached result
4. If not exists: Process request, cache result for 24 hours
5. Return result

### Rate Limiting

All endpoints rate limited:

- **Token spend**: 10 requests per minute per user
- **Campaign progress**: 60 requests per minute per user
- **Admin campaign edit**: 20 requests per minute per admin
- **Email send**: 5 requests per minute per user

### Data Protection

- All campaign and earnings data encrypted at rest (AES-256)
- TLS 1.3 for all API communications
- No PII in logs
- No payment processor data stored

---

## 10. Testing Requirements

### Test Coverage Targets
- **Overall**: 90%+ coverage
- **Token calculations**: 100% coverage
- **Campaign lifecycle**: 95%+ coverage
- **Wallet operations**: 95%+ coverage

### Critical Test Scenarios

#### Campaign Lifecycle
- ✅ Campaign transitions: draft → scheduled → active → ended
- ✅ T-14 preview visibility
- ✅ Automatic activation at start_date
- ✅ Automatic ending at end_date
- ✅ Clone campaign to new year

#### Token Wallet
- ✅ Spend order enforcement (promo → membership → purchased)
- ✅ Token expiry after grace period
- ✅ Insufficient balance scenarios
- ✅ Concurrent spend operations
- ✅ Idempotency of token awards

#### Campaign Earnings
- ✅ Base + promo calculation accuracy
- ✅ Ambassador exclusion logic
- ✅ Earnings within campaign window only
- ✅ Real-time progress calculations
- ✅ Budget cap enforcement

#### Opt-In Workflow
- ✅ Digital acknowledgement recording
- ✅ Confirmation email sent immediately
- ✅ Day 8 reminder sent
- ✅ Final reminder sent (T-24)
- ✅ End summary email sent

#### Multi-Language
- ✅ Email sent in model's preferred language
- ✅ Fallback to English if translation missing
- ✅ Template variable replacement
- ✅ Deep links work correctly

#### Timezone
- ✅ Campaign times stored as UTC, displayed as ET
- ✅ Earnings calculated in campaign window (ET)
- ✅ Email timestamps show ET
- ✅ Dashboard shows current ET time

### Load Testing

Simulate campaign scenarios:
- 1000 concurrent models viewing dashboard
- 100 models opting in simultaneously
- Campaign activation with 500 eligible models
- End of campaign summary emails to 1000 models

**Performance SLAs**:
- Dashboard load: < 500ms (p95)
- Campaign progress: < 300ms (p95)
- Opt-in submission: < 200ms (p95)
- Email delivery: < 5 seconds from trigger

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up project structure
- Configure database and ORM
- Implement timezone utilities
- Create base models and migrations
- Set up testing infrastructure

### Phase 2: Configuration & Pricing (Week 3)
- Build policy configuration system
- Implement token pricing menus
- Create admin menu management
- Add guest menu display

### Phase 3: Wallet System (Week 4)
- Implement token lot management
- Build spend order enforcement
- Add expiry handling
- Create wallet API endpoints

### Phase 4: Campaign Core (Week 5-6)
- Build campaign data model
- Implement lifecycle state machine
- Create campaign scheduler
- Add yearly versioning and cloning
- Build admin campaign CRUD

### Phase 5: Model Dashboard (Week 7)
- Create Marketing tab API
- Implement upcoming campaigns view
- Build live progress tracking
- Add ended campaigns summary

### Phase 6: Opt-In & Emails (Week 8-9)
- Implement digital acknowledgement
- Build email template system
- Add multi-language support
- Create reminder email scheduler
- Implement end summary emails

### Phase 7: Earnings & Audit (Week 10)
- Build campaign earnings ledger
- Implement earnings calculations
- Add ambassador exclusion logic
- Complete audit logging

### Phase 8: Testing & Hardening (Week 11-12)
- Achieve test coverage targets
- Perform load testing
- Security audit and fixes
- Documentation completion

---

## 12. API Reference

### Admin APIs

#### Policy Management
```
GET    /api/admin/policies
GET    /api/admin/policies/:key
PUT    /api/admin/policies/:key
POST   /api/admin/policies/validate
GET    /api/admin/policies/history/:key
```

#### Token Bundle Management
```
GET    /api/admin/token-bundles
POST   /api/admin/token-bundles
PUT    /api/admin/token-bundles/:id
DELETE /api/admin/token-bundles/:id
```

#### Campaign Management
```
GET    /api/admin/campaigns
POST   /api/admin/campaigns
GET    /api/admin/campaigns/:id
PUT    /api/admin/campaigns/:id
DELETE /api/admin/campaigns/:id
POST   /api/admin/campaigns/:id/clone
POST   /api/admin/campaigns/:id/schedule
POST   /api/admin/campaigns/:id/archive
POST   /api/admin/campaigns/:id/preview-email
```

#### Email Template Management
```
GET    /api/admin/campaigns/:id/emails
POST   /api/admin/campaigns/:id/emails
PUT    /api/admin/campaigns/:id/emails/:email_id
POST   /api/admin/campaigns/:id/emails/:email_id/translate
GET    /api/admin/campaigns/:id/emails/preview
```

#### Wallet Administration
```
POST   /api/admin/wallet/award
POST   /api/admin/wallet/expire
GET    /api/admin/wallet/audit/:user_id
```

### Guest/User APIs

#### Token Bundles
```
GET    /api/guest/token-bundles/:tier
GET    /api/guest/token-bundles/menu
```

#### Wallet
```
GET    /api/guest/wallet/balance
POST   /api/guest/wallet/spend
GET    /api/guest/wallet/lots
GET    /api/guest/wallet/transactions
```

### Model APIs

#### Marketing Dashboard
```
GET    /api/model/campaigns
GET    /api/model/campaigns/:id
GET    /api/model/campaigns/:id/progress
GET    /api/model/campaigns/:id/summary
POST   /api/model/campaigns/:id/export
```

#### Opt-In/Out
```
POST   /api/model/campaigns/:id/acknowledge
GET    /api/model/campaigns/:id/acknowledgement
```

---

## 13. Database Schema

### Tables

#### policy_configuration
- id (uuid, PK)
- key (varchar, unique)
- value (jsonb)
- description (text)
- category (varchar)
- editable_by (text[])
- last_modified (timestamptz)
- modified_by (uuid)
- version (integer)

#### token_bundles
- id (uuid, PK)
- tier (varchar)
- tokens (integer)
- price_usd (integer)
- sort_order (integer)
- active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

#### token_lots
- id (uuid, PK)
- user_id (uuid, FK)
- lot_type (varchar)
- tokens (integer)
- original_tokens (integer)
- source_id (uuid)
- awarded_at (timestamptz)
- expires_at (timestamptz)
- grace_expires_at (timestamptz)
- expired (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- idx_token_lots_user_id
- idx_token_lots_expires_at
- idx_token_lots_lot_type

#### token_transactions
- id (uuid, PK)
- user_id (uuid, FK)
- amount (integer)
- purpose (varchar)
- lots_used (jsonb)
- idempotency_key (uuid, unique)
- created_at (timestamptz)
- session_id (uuid)
- ip_address (inet)

Indexes:
- idx_token_transactions_user_id
- idx_token_transactions_created_at
- idx_token_transactions_idempotency_key

#### campaigns
- id (uuid, PK)
- key (varchar, unique)
- year (integer)
- name (varchar)
- description (text)
- notes (text)
- start_date (timestamptz)
- end_date (timestamptz)
- opt_in_window_start (timestamptz)
- opt_in_window_end (timestamptz)
- preview_days (integer)
- grace_hours (integer)
- eligible_tiers (text[])
- requires_opt_in (boolean)
- base_rate (numeric)
- target_rate (numeric)
- final_weekend_spike_rate (numeric)
- final_weekend_start (timestamptz)
- vip_token_drops (jsonb)
- budget_cap_usd (numeric)
- budget_used_usd (numeric)
- throttle_enabled (boolean)
- throttle_percent (numeric)
- status (varchar)
- created_at (timestamptz)
- updated_at (timestamptz)
- created_by (uuid, FK)

Indexes:
- idx_campaigns_status
- idx_campaigns_year
- idx_campaigns_start_date
- idx_campaigns_end_date

#### email_templates
- id (uuid, PK)
- campaign_id (uuid, FK)
- type (varchar)
- language (varchar)
- subject (varchar)
- body (text)
- created_at (timestamptz)
- updated_at (timestamptz)
- created_by (uuid, FK)

Indexes:
- idx_email_templates_campaign_id
- unique_idx_email_templates_campaign_type_lang (campaign_id, type, language)

#### campaign_acknowledgements
- id (uuid, PK)
- model_id (uuid, FK)
- campaign_id (uuid, FK)
- decision (varchar)
- agreement_version (varchar)
- agreement_text (text)
- acknowledged_at (timestamptz)
- ip_address (inet)
- user_agent (text)
- signature_data (jsonb)

Indexes:
- idx_campaign_acknowledgements_model_id
- idx_campaign_acknowledgements_campaign_id
- unique_idx_campaign_acknowledgements (model_id, campaign_id)

#### campaign_earnings
- id (uuid, PK)
- model_id (uuid, FK)
- campaign_id (uuid, FK)
- transaction_id (uuid, FK)
- tokens (integer)
- token_source (varchar)
- base_rate (numeric)
- base_earnings (numeric)
- promo_lift_rate (numeric)
- promo_earnings (numeric)
- total_earnings (numeric)
- earned_at (timestamptz)
- campaign_day (integer)
- created_at (timestamptz)
- idempotency_key (uuid, unique)

Indexes:
- idx_campaign_earnings_model_id
- idx_campaign_earnings_campaign_id
- idx_campaign_earnings_earned_at
- idx_campaign_earnings_idempotency_key

#### audit_log
- id (uuid, PK)
- timestamp (timestamptz)
- user_id (uuid, FK)
- role (varchar)
- action (varchar)
- resource_type (varchar)
- resource_id (uuid)
- changes (jsonb)
- ip_address (inet)
- user_agent (text)
- session_id (uuid)

Indexes:
- idx_audit_log_timestamp
- idx_audit_log_user_id
- idx_audit_log_resource_type
- idx_audit_log_action

---

## 14. Acceptance Criteria

### Must Have (v1)

- [x] All prices configurable in admin (no hardcoded values)
- [x] Token menus support all 5 tiers
- [x] Token wallet enforces spend order server-side
- [x] Promo tokens expire with grace period
- [x] Multiple concurrent campaigns supported
- [x] Campaign scheduler works automatically (scheduled → active → ended)
- [x] Campaigns can be cloned year-to-year
- [x] Model dashboard shows T-14 upcoming campaigns
- [x] Live campaign progress shows real-time earnings breakdown
- [x] Opt-in workflow with digital acknowledgement
- [x] Reminder emails sent (Day 8, T-24)
- [x] End of campaign summary emails
- [x] Multi-language email support with fallback
- [x] Ambassador exclusion logic works
- [x] All times display in ET
- [x] Complete audit trail for all operations
- [x] RBAC enforced on admin endpoints
- [x] 90%+ test coverage
- [x] Load testing passes SLAs

### Nice to Have (Future)

- [ ] Automated translation service integration
- [ ] Real-time budget monitoring dashboard
- [ ] Campaign analytics and reporting
- [ ] A/B testing for campaigns
- [ ] Push notifications for campaign events
- [ ] Mobile app support

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Token** | A unit used to tip or purchase services within the platform |
| **Credited per token** | Amount credited to creator's earnings ledger per token received |
| **Base creator rate** | Minimum credited per token (default: $0.065) |
| **Promo target rate** | Temporary per-token rate during campaigns (default ceiling: $0.075) |
| **Ambassador rate** | Special contract rate (default: $0.080) |
| **Promo bonus credit** | Earnings ledger line for lift above base (marketing expense) |
| **Token lot** | Wallet sub-balance by source and expiry |
| **Spend order** | Enforced order to burn tokens (promo → membership → purchased) |
| **Platform Time (ET)** | America/Toronto timezone for all operations |
| **Grace period** | Extra time (default 24 hours) before tokens expire |
| **T-14** | 14 days before campaign start |
| **Idempotency** | Guarantee that duplicate requests don't duplicate effects |

---

## Appendix B: Timezone Conversion

All dates stored in database as **UTC**.  
All dates displayed to users as **ET (America/Toronto)**.

```typescript
// Conversion utilities
function toET(utcDate: Date): Date {
  return moment(utcDate).tz('America/Toronto').toDate();
}

function toUTC(etDate: Date): Date {
  return moment.tz(etDate, 'America/Toronto').utc().toDate();
}

function formatET(date: Date): string {
  return moment(date).tz('America/Toronto').format('YYYY-MM-DD HH:mm:ss z');
}
```

---

**End of Specification**

**Version**: 1.0  
**Status**: Authoritative  
**Last Updated**: 2025-12-18
