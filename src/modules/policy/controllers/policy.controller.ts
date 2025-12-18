import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PolicyService } from '../policy.service';
import { CreatePolicyDto } from '../dto/create-policy.dto';
import { UpdatePolicyDto } from '../dto/update-policy.dto';
import { CampaignBudgetCalculatorService } from '../campaign-budget-calculator.service';
import { UserTier } from '../../token-bundles/entities/token-bundle.entity';

@Controller('admin/policies')
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly budgetCalculator: CampaignBudgetCalculatorService,
  ) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    if (category) {
      return this.policyService.findByCategory(category);
    }
    return this.policyService.findAll();
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.policyService.findOne(key);
  }

  @Post()
  async create(@Body() createPolicyDto: CreatePolicyDto) {
    // TODO: Implement authentication middleware to extract user from request
    // For now, using 'system' - this MUST be replaced before production
    const modifiedBy = 'system';
    return this.policyService.create(createPolicyDto, modifiedBy);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    // TODO: Implement authentication middleware to extract user from request
    // For now, using 'system' - this MUST be replaced before production
    const modifiedBy = 'system';
    return this.policyService.update(key, updatePolicyDto, modifiedBy);
  }

  @Post('validate')
  async validate(@Body() body: { key: string; value: any }) {
    return this.policyService.validate(body.key, body.value);
  }

  @Get(':key/history')
  async getHistory(@Param('key') key: string) {
    return this.policyService.getHistory(key);
  }

  /**
   * Calculate promotional budget for a specific tier
   */
  @Get('campaign-budget/tier/:tier')
  async calculateTierBudget(@Param('tier') tier: UserTier) {
    return this.budgetCalculator.calculateTierBudget(tier);
  }

  /**
   * Calculate aggregated promotional budget across tiers
   */
  @Post('campaign-budget/aggregate')
  async calculateAggregatedBudget(@Body() body: { userCountByTier: Record<UserTier, number> }) {
    return this.budgetCalculator.calculateAggregatedBudget(body.userCountByTier);
  }

  /**
   * Validate promotional bonus tokens against budget constraints
   */
  @Post('campaign-budget/validate')
  async validatePromotionBudget(@Body() body: { tier: UserTier; bonusTokens: number }) {
    return this.budgetCalculator.validatePromotionBudget(body.tier, body.bonusTokens);
  }
}
