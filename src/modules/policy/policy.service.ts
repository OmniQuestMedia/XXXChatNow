import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyConfiguration } from './entities/policy-configuration.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PolicyService implements OnModuleInit {
  constructor(
    @InjectRepository(PolicyConfiguration)
    private policyRepository: Repository<PolicyConfiguration>,
  ) {}

  /**
   * Initialize default policies on module start
   */
  async onModuleInit() {
    await this.seedDefaultPolicies();
  }

  /**
   * Seed default policy values if they don't exist
   */
  private async seedDefaultPolicies() {
    const defaultPolicies = [
      {
        key: 'platform_timezone',
        value: 'America/Toronto',
        description: 'Platform timezone for all operations',
        category: 'system',
        editableBy: ['super_admin'],
      },
      {
        key: 'weekly_cutoff',
        value: 'Monday 06:00 ET',
        description: 'Weekly earnings cutoff time',
        category: 'reporting',
        editableBy: ['super_admin', 'finance_admin'],
      },
      {
        key: 'creator_base_rate_per_token',
        value: 0.065,
        description: 'Minimum credited per token',
        category: 'pricing',
        editableBy: ['super_admin', 'finance_admin'],
      },
      {
        key: 'creator_promo_max_rate_per_token',
        value: 0.075,
        description: 'Maximum promo target rate',
        category: 'pricing',
        editableBy: ['super_admin', 'campaign_manager'],
      },
      {
        key: 'creator_ambassador_rate_per_token',
        value: 0.08,
        description: 'Ambassador contract rate',
        category: 'pricing',
        editableBy: ['super_admin', 'finance_admin'],
      },
      {
        key: 'ambassador_excluded_from_promo_lifts',
        value: true,
        description: 'Exclude ambassadors from promotional lifts',
        category: 'campaigns',
        editableBy: ['super_admin', 'campaign_manager'],
      },
      {
        key: 'promo_grace_hours',
        value: 24,
        description: 'Grace period for promo token expiry (hours)',
        category: 'wallet',
        editableBy: ['super_admin', 'campaign_manager'],
      },
      {
        key: 'token_spend_order',
        value: ['promo_bonus', 'membership_monthly', 'purchased'],
        description: 'Enforced spend order for token lots',
        category: 'wallet',
        editableBy: ['super_admin'],
      },
      {
        key: 'rack_rate_promo_eligible',
        value: false,
        description: 'Whether rack rate users are eligible for promotions',
        category: 'campaigns',
        editableBy: ['super_admin', 'campaign_manager'],
      },
      {
        key: 'promo_month_budget_percent',
        value: 0.7,
        description: 'Budget as percentage of membership revenue for promo months',
        category: 'campaigns',
        editableBy: ['super_admin', 'finance_admin'],
      },
    ];

    for (const policy of defaultPolicies) {
      const exists = await this.policyRepository.findOne({ where: { key: policy.key } });
      if (!exists) {
        await this.policyRepository.save(policy);
      }
    }
  }

  /**
   * Get all policies
   */
  async findAll(): Promise<PolicyConfiguration[]> {
    return this.policyRepository.find({ order: { category: 'ASC', key: 'ASC' } });
  }

  /**
   * Get policies by category
   */
  async findByCategory(category: string): Promise<PolicyConfiguration[]> {
    return this.policyRepository.find({
      where: { category },
      order: { key: 'ASC' },
    });
  }

  /**
   * Get specific policy by key
   */
  async findOne(key: string): Promise<PolicyConfiguration> {
    const policy = await this.policyRepository.findOne({ where: { key } });
    if (!policy) {
      throw new NotFoundException(`Policy with key "${key}" not found`);
    }
    return policy;
  }

  /**
   * Get policy value (convenience method)
   */
  async getValue<T = any>(key: string): Promise<T> {
    const policy = await this.findOne(key);
    return policy.value as T;
  }

  /**
   * Create new policy
   */
  async create(createPolicyDto: CreatePolicyDto, modifiedBy: string): Promise<PolicyConfiguration> {
    const policy = this.policyRepository.create({
      ...createPolicyDto,
      modifiedBy,
      version: 1,
    });
    return this.policyRepository.save(policy);
  }

  /**
   * Update existing policy
   */
  async update(
    key: string,
    updatePolicyDto: UpdatePolicyDto,
    modifiedBy: string,
  ): Promise<PolicyConfiguration> {
    const policy = await this.findOne(key);

    if (updatePolicyDto.value !== undefined) {
      policy.value = updatePolicyDto.value;
    }
    if (updatePolicyDto.description !== undefined) {
      policy.description = updatePolicyDto.description;
    }

    policy.modifiedBy = modifiedBy;
    policy.version += 1;

    return this.policyRepository.save(policy);
  }

  /**
   * Get policy change history (placeholder - would be implemented with audit log)
   */
  async getHistory(key: string): Promise<any[]> {
    // This would query the audit log table for changes to this policy
    // For now, return empty array
    return [];
  }

  /**
   * Validate policy changes (placeholder - implement business rules)
   */
  async validate(key: string, value: any): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Implement validation rules based on policy key
    switch (key) {
      case 'creator_base_rate_per_token':
      case 'creator_promo_max_rate_per_token':
      case 'creator_ambassador_rate_per_token':
        if (typeof value !== 'number' || value <= 0) {
          errors.push('Rate must be a positive number');
        }
        break;

      case 'promo_grace_hours':
        if (typeof value !== 'number' || value < 0) {
          errors.push('Grace hours must be a non-negative number');
        }
        break;

      case 'token_spend_order':
        if (!Array.isArray(value) || value.length === 0) {
          errors.push('Spend order must be a non-empty array');
        }
        break;

      default:
        // No specific validation
        break;
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
