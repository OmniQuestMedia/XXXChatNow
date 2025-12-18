import { Test, TestingModule } from '@nestjs/testing';
import { CampaignBudgetCalculatorService } from './campaign-budget-calculator.service';
import { PolicyService } from './policy.service';
import { UserTier } from '../token-bundles/entities/token-bundle.entity';

describe('CampaignBudgetCalculatorService', () => {
  let service: CampaignBudgetCalculatorService;
  let policyService: PolicyService;

  const mockPolicyService = {
    getValue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignBudgetCalculatorService,
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
      ],
    }).compile();

    service = module.get<CampaignBudgetCalculatorService>(CampaignBudgetCalculatorService);
    policyService = module.get<PolicyService>(PolicyService);

    jest.clearAllMocks();

    // Set up default mock values
    mockPolicyService.getValue.mockImplementation((key: string) => {
      const values: Record<string, any> = {
        promo_budget_cap_percent: 0.6,
        creator_base_rate_per_token: 0.065,
        promo_max_bonus_tokens_vip: 100,
        promo_max_bonus_tokens_gold_vip: 250,
        promo_max_bonus_tokens_silver_vip: 150,
        promo_max_bonus_tokens_platinum_vip: 500,
        membership_monthly_revenue_vip: 999,
        membership_monthly_revenue_gold_vip: 1999,
        membership_monthly_revenue_silver_vip: 1499,
        membership_monthly_revenue_platinum_vip: 2999,
      };
      return Promise.resolve(values[key]);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTierBudget', () => {
    it('should calculate budget for VIP tier correctly', async () => {
      const budget = await service.calculateTierBudget(UserTier.VIP);

      expect(budget.tier).toBe(UserTier.VIP);
      expect(budget.membershipRevenue).toBe(999); // $9.99 in cents
      expect(budget.maxBudgetPerUser).toBe(599); // 60% of 999
      expect(budget.maxBonusTokens).toBe(100);
      expect(budget.estimatedTokenValue).toBe(650); // 100 * 0.065 * 100 cents
      expect(budget.retainedRevenue).toBe(400); // 999 - 599
      expect(budget.retainedRevenuePercent).toBeCloseTo(40.04, 1);
    });

    it('should calculate budget for Platinum VIP tier correctly', async () => {
      const budget = await service.calculateTierBudget(UserTier.PLATINUM_VIP);

      expect(budget.tier).toBe(UserTier.PLATINUM_VIP);
      expect(budget.membershipRevenue).toBe(2999); // $29.99 in cents
      expect(budget.maxBudgetPerUser).toBe(1799); // 60% of 2999
      expect(budget.maxBonusTokens).toBe(500);
      expect(budget.estimatedTokenValue).toBe(3250); // 500 * 0.065 * 100 cents
      expect(budget.retainedRevenue).toBe(1200); // 2999 - 1799
      expect(budget.retainedRevenuePercent).toBeCloseTo(40.01, 1);
    });

    it('should return zero values for Rack Rate tier', async () => {
      const budget = await service.calculateTierBudget(UserTier.RACK_RATE);

      expect(budget.tier).toBe(UserTier.RACK_RATE);
      expect(budget.membershipRevenue).toBe(0);
      expect(budget.maxBudgetPerUser).toBe(0);
      expect(budget.maxBonusTokens).toBe(0);
    });
  });

  describe('calculateAggregatedBudget', () => {
    it('should calculate aggregated budget across multiple tiers', async () => {
      const userCountByTier = {
        [UserTier.VIP]: 100,
        [UserTier.GOLD_VIP]: 50,
        [UserTier.SILVER_VIP]: 75,
        [UserTier.PLATINUM_VIP]: 25,
        [UserTier.RACK_RATE]: 0, // Should not be included
      };

      const aggregated = await service.calculateAggregatedBudget(userCountByTier);

      expect(aggregated.totalEstimatedUsers).toBe(250); // 100 + 50 + 75 + 25
      expect(aggregated.tierBreakdown).toHaveLength(4); // All VIP tiers

      // VIP: 100 users * 650 cents = 65,000 cents
      // Gold VIP: 50 users * 1625 cents = 81,250 cents
      // Silver VIP: 75 users * 975 cents = 73,125 cents
      // Platinum VIP: 25 users * 3250 cents = 81,250 cents
      // Total = 300,625 cents
      expect(aggregated.totalPromotionCost).toBe(300625);

      // Average cost per user = 300,625 / 250 = 1202.5 cents
      expect(aggregated.averageCostPerUser).toBeCloseTo(1202.5, 0);
    });

    it('should handle zero users correctly', async () => {
      const userCountByTier = {
        [UserTier.VIP]: 0,
        [UserTier.GOLD_VIP]: 0,
        [UserTier.SILVER_VIP]: 0,
        [UserTier.PLATINUM_VIP]: 0,
        [UserTier.RACK_RATE]: 0,
      };

      const aggregated = await service.calculateAggregatedBudget(userCountByTier);

      expect(aggregated.totalEstimatedUsers).toBe(0);
      expect(aggregated.totalPromotionCost).toBe(0);
      expect(aggregated.averageCostPerUser).toBe(0);
    });
  });

  describe('validatePromotionBudget', () => {
    it('should validate bonus tokens within limits', async () => {
      const result = await service.validatePromotionBudget(UserTier.VIP, 50);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject bonus tokens exceeding tier maximum', async () => {
      const result = await service.validatePromotionBudget(UserTier.VIP, 150);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('exceed maximum allowed');
      expect(result.maxAllowed).toBe(100);
    });

    it('should reject bonus tokens exceeding budget cap', async () => {
      // Set up a scenario where cost exceeds budget
      mockPolicyService.getValue.mockImplementation((key: string) => {
        const values: Record<string, any> = {
          promo_budget_cap_percent: 0.6,
          creator_base_rate_per_token: 0.1, // Higher rate to exceed budget
          promo_max_bonus_tokens_vip: 100,
          membership_monthly_revenue_vip: 999,
        };
        return Promise.resolve(values[key]);
      });

      const result = await service.validatePromotionBudget(UserTier.VIP, 100);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('exceeds budget cap');
    });
  });

  describe('formatTierBudget', () => {
    it('should format tier budget correctly', async () => {
      const budget = await service.calculateTierBudget(UserTier.VIP);
      const formatted = service.formatTierBudget(budget);

      expect(formatted).toContain('Tier: vip');
      expect(formatted).toContain('Membership Revenue: $9.99/month');
      expect(formatted).toContain('Max Bonus Tokens: 100');
      expect(formatted).toContain('Retained Revenue (40%)');
    });
  });

  describe('formatAggregatedBudget', () => {
    it('should format aggregated budget correctly', async () => {
      const userCountByTier = {
        [UserTier.VIP]: 100,
        [UserTier.GOLD_VIP]: 50,
        [UserTier.SILVER_VIP]: 75,
        [UserTier.PLATINUM_VIP]: 25,
        [UserTier.RACK_RATE]: 0,
      };

      const aggregated = await service.calculateAggregatedBudget(userCountByTier);
      const formatted = service.formatAggregatedBudget(aggregated);

      expect(formatted).toContain('AGGREGATED TOTALS');
      expect(formatted).toContain('Total Estimated Users: 250');
      expect(formatted).toContain('Total Promotion Cost');
      expect(formatted).toContain('Average Cost Per User');
    });
  });
});
