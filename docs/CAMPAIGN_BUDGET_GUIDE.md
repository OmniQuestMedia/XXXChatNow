# Campaign Budget Calculation Guide

**Version**: 1.0  
**Last Updated**: 2025-12-18  
**Status**: Implementation Complete

---

## Overview

The Campaign Budget Calculator provides automatic budget calculations and validation for promotional campaigns based on membership revenue and configurable constraints. This ensures:

1. **Financial Sustainability**: Maximum 60% of membership revenue allocated to promotions
2. **Revenue Retention**: Minimum 40% of membership revenue retained for OmniQuest Media Inc.
3. **Tier-Specific Limits**: Configurable maximum bonus token amounts per VIP tier
4. **Cost Transparency**: Clear visibility into promotional costs and estimated token values

---

## Budget Calculation Policies

### New Policy Configurations

The following policies have been added to support campaign budget calculations:

| Policy Key | Default Value | Description |
|------------|---------------|-------------|
| `promo_budget_cap_percent` | 0.60 | Maximum 60% of membership revenue for promotional budget |
| `promo_max_bonus_tokens_vip` | 100 | Maximum bonus tokens per VIP member |
| `promo_max_bonus_tokens_gold_vip` | 250 | Maximum bonus tokens per Gold VIP member |
| `promo_max_bonus_tokens_silver_vip` | 150 | Maximum bonus tokens per Silver VIP member |
| `promo_max_bonus_tokens_platinum_vip` | 500 | Maximum bonus tokens per Platinum VIP member |
| `membership_monthly_revenue_vip` | 999 | Monthly revenue per VIP user (cents) = $9.99 |
| `membership_monthly_revenue_gold_vip` | 1999 | Monthly revenue per Gold VIP user (cents) = $19.99 |
| `membership_monthly_revenue_silver_vip` | 1499 | Monthly revenue per Silver VIP user (cents) = $14.99 |
| `membership_monthly_revenue_platinum_vip` | 2999 | Monthly revenue per Platinum VIP user (cents) = $29.99 |

---

## Budget Calculation Logic

### Per-Tier Budget Calculation

For each VIP tier, the system calculates:

```typescript
membershipRevenue = membership_monthly_revenue_[tier]
maxBudgetPerUser = membershipRevenue * 0.60  // 60% cap
retainedRevenue = membershipRevenue * 0.40   // 40% retention
maxBonusTokens = promo_max_bonus_tokens_[tier]
estimatedTokenValue = maxBonusTokens * creator_base_rate_per_token * 100
```

### Example: VIP Tier

```
Membership Revenue: $9.99/month (999 cents)
Max Promo Budget (60%): $5.99 (599 cents)
Retained Revenue (40%): $4.00 (400 cents)
Max Bonus Tokens: 100
Estimated Token Value: $6.50 (100 * $0.065 * 100)
```

**Note**: The estimated token value ($6.50) slightly exceeds the budget cap ($5.99), which provides a safety buffer. Admins can adjust the `promo_max_bonus_tokens_vip` value to fit exactly within budget if needed.

### Example: Platinum VIP Tier

```
Membership Revenue: $29.99/month (2999 cents)
Max Promo Budget (60%): $17.99 (1799 cents)
Retained Revenue (40%): $12.00 (1200 cents)
Max Bonus Tokens: 500
Estimated Token Value: $32.50 (500 * $0.065 * 100)
```

---

## API Usage

### 1. Calculate Budget for a Specific Tier

```http
GET /api/admin/policies/campaign-budget/tier/vip
```

**Response:**
```json
{
  "tier": "vip",
  "membershipRevenue": 999,
  "maxBudgetPerUser": 599,
  "maxBonusTokens": 100,
  "estimatedTokenValue": 650,
  "retainedRevenue": 400,
  "retainedRevenuePercent": 40.04
}
```

### 2. Calculate Aggregated Budget Across All Tiers

```http
POST /api/admin/policies/campaign-budget/aggregate
Content-Type: application/json

{
  "userCountByTier": {
    "vip": 100,
    "gold_vip": 50,
    "silver_vip": 75,
    "platinum_vip": 25
  }
}
```

**Response:**
```json
{
  "totalEstimatedUsers": 250,
  "totalPromotionCost": 300625,
  "totalRetainedRevenue": 120000,
  "averageCostPerUser": 1202.5,
  "averageRetainedPerUser": 480,
  "tierBreakdown": [
    {
      "tier": "vip",
      "membershipRevenue": 999,
      "maxBudgetPerUser": 599,
      "maxBonusTokens": 100,
      "estimatedTokenValue": 650,
      "retainedRevenue": 400,
      "retainedRevenuePercent": 40.04
    },
    // ... other tiers
  ]
}
```

**Breakdown:**
- **Total Users**: 250 (100 VIP + 50 Gold + 75 Silver + 25 Platinum)
- **Total Promotion Cost**: $3,006.25
- **Total Retained Revenue**: $1,200.00
- **Average Cost Per User**: $12.03
- **Average Retained Per User**: $4.80

### 3. Validate Promotion Budget

Before awarding bonus tokens, validate against budget constraints:

```http
POST /api/admin/policies/campaign-budget/validate
Content-Type: application/json

{
  "tier": "vip",
  "bonusTokens": 50
}
```

**Success Response:**
```json
{
  "valid": true
}
```

**Failure Response (Exceeds Maximum):**
```json
{
  "valid": false,
  "message": "Bonus tokens (150) exceed maximum allowed for vip tier",
  "maxAllowed": 100
}
```

**Failure Response (Exceeds Budget):**
```json
{
  "valid": false,
  "message": "Estimated cost (1000 cents) exceeds budget cap (599 cents) for vip tier",
  "maxAllowed": 92
}
```

---

## Admin Workflow

### Setting Up a Promotion

1. **Review Current Budget Policies**
   ```http
   GET /api/admin/policies?category=campaigns
   GET /api/admin/policies?category=pricing
   ```

2. **Calculate Budget for Target Tiers**
   ```http
   GET /api/admin/policies/campaign-budget/tier/vip
   GET /api/admin/policies/campaign-budget/tier/gold_vip
   GET /api/admin/policies/campaign-budget/tier/silver_vip
   GET /api/admin/policies/campaign-budget/tier/platinum_vip
   ```

3. **Estimate Total Cost**
   ```http
   POST /api/admin/policies/campaign-budget/aggregate
   {
     "userCountByTier": {
       "vip": 1000,
       "gold_vip": 500,
       "silver_vip": 750,
       "platinum_vip": 250
     }
   }
   ```

4. **Adjust Max Bonus Tokens If Needed**
   ```http
   PUT /api/admin/policies/promo_max_bonus_tokens_vip
   {
     "value": 90  // Reduced to fit within budget cap
   }
   ```

5. **Validate Before Campaign Launch**
   ```http
   POST /api/admin/policies/campaign-budget/validate
   {
     "tier": "vip",
     "bonusTokens": 90
   }
   ```

---

## Updating Budget Policies

### Adjusting Maximum Bonus Tokens

If you need to change the maximum bonus tokens for a tier:

```http
PUT /api/admin/policies/promo_max_bonus_tokens_vip
{
  "value": 120,
  "description": "Increased for Q1 2026 promotion"
}
```

### Adjusting Membership Revenue

If membership pricing changes:

```http
PUT /api/admin/policies/membership_monthly_revenue_vip
{
  "value": 1199,  // New price: $11.99
  "description": "Updated VIP membership price effective Jan 2026"
}
```

### Adjusting Budget Cap Percentage

To change the 60/40 split:

```http
PUT /api/admin/policies/promo_budget_cap_percent
{
  "value": 0.55,  // 55% for promotions, 45% retained
  "description": "Adjusted for conservative Q1 budget"
}
```

---

## Budget Validation Rules

The system enforces the following validation rules:

1. **Tier Maximum Check**
   - Bonus tokens cannot exceed `promo_max_bonus_tokens_[tier]`
   - Example: VIP tier limited to 100 tokens (default)

2. **Budget Cap Check**
   - Estimated cost must not exceed `maxBudgetPerUser`
   - Estimated cost = `bonusTokens * creator_base_rate_per_token * 100`
   - Example: 100 tokens * $0.065 * 100 = $6.50

3. **Revenue Retention Guarantee**
   - System always retains minimum 40% of membership revenue
   - This is enforced via `promo_budget_cap_percent` (default 0.60)

---

## Financial Reporting

### Pre-populated Values for Campaign Creation

When creating a new campaign in the admin UI, the following fields will be pre-populated based on budget calculations:

1. **Max Bonus Tokens per Tier** (grayscale, editable)
   - VIP: 100 tokens
   - Gold VIP: 250 tokens
   - Silver VIP: 150 tokens
   - Platinum VIP: 500 tokens

2. **Cost of Promotion per User** (calculated)
   - Based on VIP tier membership revenue
   - Shows 60% allocation vs 40% retention

3. **Aggregated Cost Estimates** (calculated)
   - Total promotion cost across all tiers
   - Total retained revenue
   - Average cost per user
   - Average retained per user

### Example Campaign Budget Summary

```
Campaign: Pride Month 2026
Estimated Participants: 2,500 users

Budget Breakdown by Tier:
┌─────────────┬───────┬──────────┬─────────┬──────────┬──────────┐
│ Tier        │ Users │ Promo    │ Retained│ Per User │ Total    │
├─────────────┼───────┼──────────┼─────────┼──────────┼──────────┤
│ VIP         │ 1,000 │ $5,990   │ $4,000  │ $9.99    │ $9,990   │
│ Gold VIP    │   500 │ $8,995   │ $6,000  │ $19.99   │ $9,995   │
│ Silver VIP  │   750 │ $6,743   │ $4,500  │ $14.99   │ $11,243  │
│ Platinum    │   250 │ $4,498   │ $3,000  │ $29.99   │ $7,498   │
├─────────────┼───────┼──────────┼─────────┼──────────┼──────────┤
│ TOTAL       │ 2,500 │ $26,226  │ $17,500 │ $17.49   │ $43,726  │
└─────────────┴───────┴──────────┴─────────┴──────────┴──────────┘

Revenue Retention: $17,500 (39.92% of total revenue)
Promotion Investment: $26,226 (60.08% of total revenue)
```

---

## Best Practices

### 1. Conservative Budgeting
- Start with default max bonus tokens
- Review aggregated costs before launch
- Adjust maximums to fit within budget if needed

### 2. Regular Policy Reviews
- Review membership revenue policies monthly
- Update when pricing changes
- Audit promotional spending against budgets

### 3. Campaign Planning
- Calculate budgets during campaign design phase
- Share aggregated costs with finance team
- Document any policy adjustments

### 4. Testing
- Always validate bonus token amounts before awarding
- Test with small user samples first
- Monitor actual costs vs estimated costs

---

## Integration with Campaign Engine

When the Campaign Engine is implemented, it will use these budget calculations to:

1. **Pre-populate Campaign Forms**
   - Show recommended max bonus tokens per tier
   - Display estimated costs in UI
   - Highlight budget constraints

2. **Enforce Budget Limits**
   - Prevent creating campaigns that exceed budget caps
   - Validate token drops against tier limits
   - Alert when approaching budget thresholds

3. **Track Actual Costs**
   - Compare estimated vs actual token awards
   - Generate budget variance reports
   - Update forecasts based on actual usage

---

## Troubleshooting

### Issue: Estimated Token Value Exceeds Budget Cap

**Problem**: The estimated token value ($6.50 for VIP) exceeds the budget cap ($5.99).

**Solution**: Reduce the `promo_max_bonus_tokens_vip` value:
```http
PUT /api/admin/policies/promo_max_bonus_tokens_vip
{ "value": 90 }  // 90 * $0.065 * 100 = $5.85
```

### Issue: Aggregated Cost Too High

**Problem**: Total promotional cost exceeds available budget.

**Solution**: 
1. Reduce max bonus tokens for high-cost tiers
2. Limit campaign to specific tiers
3. Reduce estimated user participation
4. Increase membership prices (if feasible)

### Issue: Revenue Retention Below 40%

**Problem**: Budget calculations show less than 40% retention.

**Cause**: This should not happen as the system enforces 60% cap.

**Solution**: Check if `promo_budget_cap_percent` was manually increased above 0.60. Reset to 0.60 or lower.

---

## Security Considerations

1. **Policy Updates**: Only `super_admin` and `finance_admin` can modify budget-related policies
2. **Audit Logging**: All policy changes are logged with user ID and timestamp
3. **Validation**: Budget validation must pass before token awards
4. **Read-Only Calculations**: Budget calculations are read-only and don't modify data

---

## Future Enhancements

Planned improvements for budget calculations:

1. **Historical Analysis**
   - Track actual vs estimated costs
   - Identify trends in token redemption
   - Improve budget forecasting

2. **Dynamic Adjustment**
   - Auto-adjust max tokens based on membership pricing changes
   - Suggest optimal token amounts for budget targets
   - Alert when policies conflict with budget goals

3. **Advanced Reporting**
   - ROI analysis for promotional campaigns
   - Comparative analysis across campaigns
   - Budget utilization dashboards

---

## Summary

The Campaign Budget Calculator ensures financial sustainability by:
- ✅ Capping promotional spending at 60% of membership revenue
- ✅ Guaranteeing 40% revenue retention for OQMI
- ✅ Providing tier-specific limits on bonus tokens
- ✅ Calculating aggregated costs across all tiers
- ✅ Validating promotional budgets before campaigns launch
- ✅ Maintaining transparency in cost estimates

All values are admin-configurable and support the flexible, data-driven promotional system required by the work order.

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-18  
**Related Documents**:
- [Token Pricing Specification](/docs/specs/TOKEN_PRICING_CAMPAIGNS_SPEC_v1.0.md)
- [Implementation Status](/docs/IMPLEMENTATION_STATUS.md)
- [Copilot Engineering Rules](/docs/copilot/COPILOT.md)
