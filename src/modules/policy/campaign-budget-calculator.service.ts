import { Injectable } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { UserTier } from '../token-bundles/entities/token-bundle.entity';

export interface TierBudgetCalculation {
  tier: UserTier;
  membershipRevenue: number; // Monthly revenue per user in cents
  maxBudgetPerUser: number; // 60% of membership revenue
  maxBonusTokens: number; // Configurable max tokens
  estimatedTokenValue: number; // maxBonusTokens * base_rate
  retainedRevenue: number; // 40% retained for OQMI
  retainedRevenuePercent: number; // Should be 40%
}

export interface AggregatedPromotionBudget {
  totalEstimatedUsers: number;
  tierBreakdown: TierBudgetCalculation[];
  totalPromotionCost: number; // Sum of all tier costs
  totalRetainedRevenue: number; // Sum of all tier retained revenue
  averageCostPerUser: number;
  averageRetainedPerUser: number;
}

@Injectable()
export class CampaignBudgetCalculatorService {
  constructor(private readonly policyService: PolicyService) {}

  /**
   * Calculate promotional budget for a specific tier
   */
  async calculateTierBudget(tier: UserTier): Promise<TierBudgetCalculation> {
    // Get membership revenue for this tier
    const membershipRevenue = await this.getMembershipRevenue(tier);

    // Get budget cap (default 60%)
    const budgetCapPercent = await this.policyService.getValue<number>('promo_budget_cap_percent');

    // Calculate max budget per user (60% of membership revenue)
    const maxBudgetPerUser = Math.floor(membershipRevenue * budgetCapPercent);

    // Get max bonus tokens for this tier
    const maxBonusTokens = await this.getMaxBonusTokens(tier);

    // Get creator base rate to estimate token value
    const baseRate = await this.policyService.getValue<number>('creator_base_rate_per_token');

    // Calculate estimated value of awarded tokens (in cents)
    const estimatedTokenValue = Math.floor(maxBonusTokens * baseRate * 100);

    // Calculate retained revenue (40% of membership revenue)
    const retainedRevenue = membershipRevenue - maxBudgetPerUser;
    const retainedRevenuePercent = (retainedRevenue / membershipRevenue) * 100;

    return {
      tier,
      membershipRevenue,
      maxBudgetPerUser,
      maxBonusTokens,
      estimatedTokenValue,
      retainedRevenue,
      retainedRevenuePercent,
    };
  }

  /**
   * Calculate aggregated promotion budget across all tiers
   * @param userCountByTier - Map of tier to estimated user count
   */
  async calculateAggregatedBudget(
    userCountByTier: Record<UserTier, number>,
  ): Promise<AggregatedPromotionBudget> {
    const eligibleTiers = [
      UserTier.VIP,
      UserTier.GOLD_VIP,
      UserTier.SILVER_VIP,
      UserTier.PLATINUM_VIP,
    ];

    const tierBreakdown: TierBudgetCalculation[] = [];
    let totalPromotionCost = 0;
    let totalRetainedRevenue = 0;
    let totalEstimatedUsers = 0;

    for (const tier of eligibleTiers) {
      const tierBudget = await this.calculateTierBudget(tier);
      const userCount = userCountByTier[tier] || 0;

      tierBreakdown.push(tierBudget);

      totalPromotionCost += tierBudget.estimatedTokenValue * userCount;
      totalRetainedRevenue += tierBudget.retainedRevenue * userCount;
      totalEstimatedUsers += userCount;
    }

    const averageCostPerUser =
      totalEstimatedUsers > 0 ? totalPromotionCost / totalEstimatedUsers : 0;
    const averageRetainedPerUser =
      totalEstimatedUsers > 0 ? totalRetainedRevenue / totalEstimatedUsers : 0;

    return {
      totalEstimatedUsers,
      tierBreakdown,
      totalPromotionCost,
      totalRetainedRevenue,
      averageCostPerUser,
      averageRetainedPerUser,
    };
  }

  /**
   * Get membership revenue for a specific tier
   */
  private async getMembershipRevenue(tier: UserTier): Promise<number> {
    switch (tier) {
      case UserTier.VIP:
        return this.policyService.getValue<number>('membership_monthly_revenue_vip');
      case UserTier.GOLD_VIP:
        return this.policyService.getValue<number>('membership_monthly_revenue_gold_vip');
      case UserTier.SILVER_VIP:
        return this.policyService.getValue<number>('membership_monthly_revenue_silver_vip');
      case UserTier.PLATINUM_VIP:
        return this.policyService.getValue<number>('membership_monthly_revenue_platinum_vip');
      case UserTier.RACK_RATE:
        return 0; // Rack rate has no membership revenue
      default:
        return 0;
    }
  }

  /**
   * Get maximum bonus tokens for a specific tier
   */
  private async getMaxBonusTokens(tier: UserTier): Promise<number> {
    switch (tier) {
      case UserTier.VIP:
        return this.policyService.getValue<number>('promo_max_bonus_tokens_vip');
      case UserTier.GOLD_VIP:
        return this.policyService.getValue<number>('promo_max_bonus_tokens_gold_vip');
      case UserTier.SILVER_VIP:
        return this.policyService.getValue<number>('promo_max_bonus_tokens_silver_vip');
      case UserTier.PLATINUM_VIP:
        return this.policyService.getValue<number>('promo_max_bonus_tokens_platinum_vip');
      case UserTier.RACK_RATE:
        return 0; // Rack rate gets no promo tokens
      default:
        return 0;
    }
  }

  /**
   * Validate that promotion cost doesn't exceed budget cap
   */
  async validatePromotionBudget(tier: UserTier, bonusTokens: number): Promise<{
    valid: boolean;
    message?: string;
    maxAllowed?: number;
  }> {
    const maxBonusTokens = await this.getMaxBonusTokens(tier);

    if (bonusTokens > maxBonusTokens) {
      return {
        valid: false,
        message: `Bonus tokens (${bonusTokens}) exceed maximum allowed for ${tier} tier`,
        maxAllowed: maxBonusTokens,
      };
    }

    // Calculate cost and verify it's within budget
    const tierBudget = await this.calculateTierBudget(tier);
    const baseRate = await this.policyService.getValue<number>('creator_base_rate_per_token');
    const estimatedCost = Math.floor(bonusTokens * baseRate * 100);

    if (estimatedCost > tierBudget.maxBudgetPerUser) {
      return {
        valid: false,
        message: `Estimated cost (${estimatedCost} cents) exceeds budget cap (${tierBudget.maxBudgetPerUser} cents) for ${tier} tier`,
        maxAllowed: Math.floor(tierBudget.maxBudgetPerUser / (baseRate * 100)),
      };
    }

    return { valid: true };
  }

  /**
   * Format budget calculation for display
   */
  formatTierBudget(budget: TierBudgetCalculation): string {
    return `
Tier: ${budget.tier}
Membership Revenue: $${(budget.membershipRevenue / 100).toFixed(2)}/month
Max Promo Budget (60%): $${(budget.maxBudgetPerUser / 100).toFixed(2)}
Max Bonus Tokens: ${budget.maxBonusTokens}
Estimated Token Value: $${(budget.estimatedTokenValue / 100).toFixed(2)}
Retained Revenue (40%): $${(budget.retainedRevenue / 100).toFixed(2)}
    `.trim();
  }

  /**
   * Format aggregated budget for display
   */
  formatAggregatedBudget(budget: AggregatedPromotionBudget): string {
    const tierSummaries = budget.tierBreakdown
      .map((tier) => this.formatTierBudget(tier))
      .join('\n\n');

    return `
${tierSummaries}

AGGREGATED TOTALS:
Total Estimated Users: ${budget.totalEstimatedUsers}
Total Promotion Cost: $${(budget.totalPromotionCost / 100).toFixed(2)}
Total Retained Revenue: $${(budget.totalRetainedRevenue / 100).toFixed(2)}
Average Cost Per User: $${(budget.averageCostPerUser / 100).toFixed(2)}
Average Retained Per User: $${(budget.averageRetainedPerUser / 100).toFixed(2)}
    `.trim();
  }
}
