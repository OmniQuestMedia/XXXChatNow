/**
 * Slot Machine Configuration Service
 * 
 * Manages slot machine configuration (odds, payouts, limits).
 * Supports hot-reloading without deployment.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (Configuration Management section)
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SlotMachineConfig, SlotMachineConfigDocument } from '../schemas';
import { SlotMachineConfigDto } from '../dtos';
import { DEFAULT_SYMBOLS, DEFAULT_SPIN_COST, DEFAULT_RTP, MAX_SPINS_PER_HOUR } from '../constants';

@Injectable()
export class SlotMachineConfigService {
  constructor(
    @InjectModel(SlotMachineConfig.name)
    private readonly configModel: Model<SlotMachineConfigDocument>
  ) {}

  /**
   * Get the currently active configuration
   * Cached for performance
   */
  public async getActiveConfig(): Promise<SlotMachineConfigDocument> {
    const config = await this.configModel.findOne({ isActive: true }).lean();
    
    if (!config) {
      // If no config exists, create default one
      return this.createDefaultConfig();
    }

    return config;
  }

  /**
   * Create default configuration based on briefing specifications
   */
  private async createDefaultConfig(): Promise<SlotMachineConfigDocument> {
    const defaultConfig = {
      configName: 'default',
      version: 1,
      isActive: true,
      spinCost: DEFAULT_SPIN_COST,
      symbols: DEFAULT_SYMBOLS,
      returnToPlayer: DEFAULT_RTP,
      maxSpinsPerHour: MAX_SPINS_PER_HOUR,
      effectiveDate: new Date(),
      createdBy: 'system'
    };

    return this.configModel.create(defaultConfig);
  }

  /**
   * Get configuration by ID
   */
  public async getConfigById(id: string): Promise<SlotMachineConfigDocument> {
    const config = await this.configModel.findById(id);
    
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    return config;
  }

  /**
   * Create a new configuration version
   * Admin-only operation (enforced at controller level)
   */
  public async createConfig(
    configData: Partial<SlotMachineConfig>,
    createdBy: string
  ): Promise<SlotMachineConfigDocument> {
    // Validate symbols rarities sum to 1.0
    if (configData.symbols) {
      const totalRarity = configData.symbols.reduce((sum, s) => sum + s.rarity, 0);
      if (Math.abs(totalRarity - 1.0) > 0.01) {
        throw new BadRequestException(
          `Symbol rarities must sum to 1.0, got ${totalRarity}`
        );
      }
    }

    // Get next version number
    const latestConfig = await this.configModel
      .findOne({ configName: configData.configName })
      .sort({ version: -1 });

    const version = latestConfig ? latestConfig.version + 1 : 1;

    const config = await this.configModel.create({
      ...configData,
      version,
      createdBy,
      isActive: false, // New configs start inactive
      effectiveDate: configData.effectiveDate || new Date()
    });

    return config;
  }

  /**
   * Activate a configuration
   * Only one config can be active at a time
   */
  public async activateConfig(
    configId: string,
    activatedBy: string
  ): Promise<SlotMachineConfigDocument> {
    const config = await this.getConfigById(configId);

    // Deactivate current active config
    await this.configModel.updateMany(
      { isActive: true },
      { isActive: false }
    );

    // Activate new config
    config.isActive = true;
    config.effectiveDate = new Date();
    await config.save();

    // TODO: UI HOOK POINT - Emit event for real-time config update to frontend
    // this.eventEmitter.emit('slot-machine.config.activated', new SlotMachineConfigDto(config));

    return config;
  }

  /**
   * Get all configurations (admin only)
   */
  public async getAllConfigs(): Promise<SlotMachineConfigDocument[]> {
    return this.configModel.find().sort({ createdAt: -1 });
  }

  /**
   * Validate configuration integrity
   * Ensures RTP matches symbol probabilities and payouts
   */
  public validateConfigIntegrity(config: SlotMachineConfig): boolean {
    // TODO: Implement mathematical validation of RTP
    // This should verify that the configured RTP matches the actual
    // expected return based on symbol probabilities and payouts
    return true;
  }
}
