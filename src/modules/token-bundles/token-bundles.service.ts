import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBundle, UserTier } from './entities/token-bundle.entity';
import { CreateTokenBundleDto } from './dto/create-token-bundle.dto';
import { UpdateTokenBundleDto } from './dto/update-token-bundle.dto';

interface MenuCalculations {
  highestCostPerToken: number;
  lowestCostPerToken: number;
  blendedAverage: number;
}

interface TierMenu {
  tier: UserTier;
  bundles: TokenBundle[];
  calculations: MenuCalculations;
  footerStatement: string;
}

@Injectable()
export class TokenBundlesService {
  private readonly FOOTER_STATEMENT =
    'Creator Earnings: Models are credited a minimum of $0.065 per token received, ' +
    'regardless of bundle price. During promotions, bonus credits may be added separately.';

  constructor(
    @InjectRepository(TokenBundle)
    private tokenBundleRepository: Repository<TokenBundle>,
  ) {}

  /**
   * Create a new token bundle
   */
  async create(createTokenBundleDto: CreateTokenBundleDto): Promise<TokenBundle> {
    const bundle = this.tokenBundleRepository.create(createTokenBundleDto);
    return this.tokenBundleRepository.save(bundle);
  }

  /**
   * Get all bundles (admin view)
   */
  async findAll(): Promise<TokenBundle[]> {
    return this.tokenBundleRepository.find({
      order: { tier: 'ASC', sortOrder: 'ASC' },
    });
  }

  /**
   * Get active bundles for a specific tier
   */
  async findByTier(tier: UserTier): Promise<TokenBundle[]> {
    return this.tokenBundleRepository.find({
      where: { tier, active: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Get a single bundle by ID
   */
  async findOne(id: string): Promise<TokenBundle> {
    const bundle = await this.tokenBundleRepository.findOne({ where: { id } });
    if (!bundle) {
      throw new NotFoundException(`Token bundle with ID "${id}" not found`);
    }
    return bundle;
  }

  /**
   * Update a token bundle
   */
  async update(id: string, updateTokenBundleDto: UpdateTokenBundleDto): Promise<TokenBundle> {
    const bundle = await this.findOne(id);
    Object.assign(bundle, updateTokenBundleDto);
    return this.tokenBundleRepository.save(bundle);
  }

  /**
   * Deactivate a token bundle (soft delete)
   */
  async deactivate(id: string): Promise<TokenBundle> {
    const bundle = await this.findOne(id);
    bundle.active = false;
    return this.tokenBundleRepository.save(bundle);
  }

  /**
   * Get complete menu for a tier with calculations
   */
  async getMenuForTier(tier: UserTier): Promise<TierMenu> {
    const bundles = await this.findByTier(tier);

    if (bundles.length === 0) {
      return {
        tier,
        bundles: [],
        calculations: {
          highestCostPerToken: 0,
          lowestCostPerToken: 0,
          blendedAverage: 0,
        },
        footerStatement: this.FOOTER_STATEMENT,
      };
    }

    const calculations = this.calculateMenuStats(bundles);

    return {
      tier,
      bundles,
      calculations,
      footerStatement: this.FOOTER_STATEMENT,
    };
  }

  /**
   * Get all menus for all tiers
   */
  async getAllMenus(): Promise<TierMenu[]> {
    const tiers = Object.values(UserTier);
    const menus: TierMenu[] = [];

    for (const tier of tiers) {
      const menu = await this.getMenuForTier(tier);
      menus.push(menu);
    }

    return menus;
  }

  /**
   * Calculate menu statistics
   */
  private calculateMenuStats(bundles: TokenBundle[]): MenuCalculations {
    const costs = bundles.map((b) => b.costPerToken);

    const highestCostPerToken = Math.max(...costs);
    const lowestCostPerToken = Math.min(...costs);

    // Simple average (can be weighted based on admin config in the future)
    const blendedAverage = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

    return {
      highestCostPerToken: Math.round(highestCostPerToken * 100) / 100,
      lowestCostPerToken: Math.round(lowestCostPerToken * 100) / 100,
      blendedAverage: Math.round(blendedAverage * 100) / 100,
    };
  }

  /**
   * Seed default token bundles (for development/testing)
   */
  async seedDefaultBundles(): Promise<void> {
    const existingCount = await this.tokenBundleRepository.count();
    if (existingCount > 0) {
      return; // Already seeded
    }

    const defaultBundles = [
      // Rack Rate
      { tier: UserTier.RACK_RATE, tokens: 100, priceUsd: 1099, sortOrder: 1 },
      { tier: UserTier.RACK_RATE, tokens: 250, priceUsd: 2499, sortOrder: 2 },
      { tier: UserTier.RACK_RATE, tokens: 500, priceUsd: 4599, sortOrder: 3 },
      { tier: UserTier.RACK_RATE, tokens: 1000, priceUsd: 8999, sortOrder: 4 },

      // VIP
      { tier: UserTier.VIP, tokens: 100, priceUsd: 999, sortOrder: 1 },
      { tier: UserTier.VIP, tokens: 250, priceUsd: 2299, sortOrder: 2 },
      { tier: UserTier.VIP, tokens: 500, priceUsd: 4299, sortOrder: 3 },
      { tier: UserTier.VIP, tokens: 1000, priceUsd: 7999, sortOrder: 4 },

      // Gold VIP
      { tier: UserTier.GOLD_VIP, tokens: 100, priceUsd: 899, sortOrder: 1 },
      { tier: UserTier.GOLD_VIP, tokens: 250, priceUsd: 2099, sortOrder: 2 },
      { tier: UserTier.GOLD_VIP, tokens: 500, priceUsd: 3999, sortOrder: 3 },
      { tier: UserTier.GOLD_VIP, tokens: 1000, priceUsd: 7499, sortOrder: 4 },

      // Silver VIP
      { tier: UserTier.SILVER_VIP, tokens: 100, priceUsd: 949, sortOrder: 1 },
      { tier: UserTier.SILVER_VIP, tokens: 250, priceUsd: 2199, sortOrder: 2 },
      { tier: UserTier.SILVER_VIP, tokens: 500, priceUsd: 4199, sortOrder: 3 },
      { tier: UserTier.SILVER_VIP, tokens: 1000, priceUsd: 7799, sortOrder: 4 },

      // Platinum VIP
      { tier: UserTier.PLATINUM_VIP, tokens: 100, priceUsd: 799, sortOrder: 1 },
      { tier: UserTier.PLATINUM_VIP, tokens: 250, priceUsd: 1899, sortOrder: 2 },
      { tier: UserTier.PLATINUM_VIP, tokens: 500, priceUsd: 3699, sortOrder: 3 },
      { tier: UserTier.PLATINUM_VIP, tokens: 1000, priceUsd: 6999, sortOrder: 4 },
    ];

    for (const bundle of defaultBundles) {
      await this.create(bundle as CreateTokenBundleDto);
    }
  }
}
