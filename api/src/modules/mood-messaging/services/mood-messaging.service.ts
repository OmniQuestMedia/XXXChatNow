import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  MoodBucket,
  MoodBucketDocument,
  ModelMoodConfig,
  ModelMoodConfigDocument,
  UserMessageHistory,
  UserMessageHistoryDocument
} from '../schemas';
import {
  SelectMoodResponseDto,
  UpdateModelConfigDto,
  MessageContextDto
} from '../dtos';
import {
  DEFAULT_AUTO_RESPOND,
  DEFAULT_RESPONSE_DELAY,
  DEFAULT_DAILY_LIMIT
} from '../constants';

/**
 * MoodMessagingService
 * Handles mood messaging response selection and configuration management
 */
@Injectable()
export class MoodMessagingService {
  private readonly logger = new Logger(MoodMessagingService.name);

  constructor(
    @InjectModel(MoodBucket.name)
    private moodBucketModel: Model<MoodBucketDocument>,
    @InjectModel(ModelMoodConfig.name)
    private modelMoodConfigModel: Model<ModelMoodConfigDocument>,
    @InjectModel(UserMessageHistory.name)
    private userMessageHistoryModel: Model<UserMessageHistoryDocument>
  ) {}

  /**
   * Selects a random response from a mood bucket using cryptographically secure randomization
   * @param dto Request data with bucket name and optional context
   * @param authenticatedUserId ID of the authenticated user making the request
   * @returns Selected response with metadata
   */
  async selectMoodResponse(
    dto: SelectMoodResponseDto,
    authenticatedUserId: string
  ): Promise<{
    success: boolean;
    response: string;
    bucketId: string;
    bucketName: string;
  }> {
    const { bucketName, performerId, context } = dto;

    // Find the mood bucket
    const bucket = await this.moodBucketModel.findOne({
      name: bucketName,
      active: true
    });

    if (!bucket) {
      throw new NotFoundException(`Mood bucket '${bucketName}' not found or inactive`);
    }

    // Determine which responses to use
    let responses = bucket.responses;
    let responseSource = 'default';

    // If performerId is provided, check for custom responses
    if (performerId) {
      const config = await this.modelMoodConfigModel.findOne({
        performerId
      });

      if (config && config.customResponses) {
        const customResponse = config.customResponses.find(
          (cr) => cr.bucketId.toString() === bucket._id.toString()
        );

        if (customResponse && customResponse.responses.length > 0) {
          responses = customResponse.responses;
          responseSource = 'custom';
        }
      }
    }

    // Validate responses array
    if (!responses || responses.length === 0) {
      throw new BadRequestException('No responses available in this bucket');
    }

    // Use cryptographically secure random selection
    const selectedResponse = this.selectSecureRandom(responses);
    const responseIndex = responses.indexOf(selectedResponse);

    // Log the selection for audit purposes (no PII)
    this.logger.log(
      `Response selected from bucket '${bucketName}' ` +
      `(source: ${responseSource}, index: ${responseIndex})`
    );

    // Record usage history (async, don't block response)
    this.recordUsageHistory(
      authenticatedUserId,
      performerId || authenticatedUserId,
      bucket._id.toString(),
      bucketName,
      responseIndex,
      context
    ).catch((err) => {
      this.logger.error(`Failed to record usage history: ${err.message}`);
    });

    return {
      success: true,
      response: selectedResponse,
      bucketId: bucket._id.toString(),
      bucketName: bucket.name
    };
  }

  /**
   * Gets the mood messaging configuration for a performer
   * Creates default configuration if none exists
   * @param performerId ID of the performer
   * @returns Model mood configuration
   */
  async getModelConfig(performerId: string): Promise<ModelMoodConfig> {
    let config = await this.modelMoodConfigModel
      .findOne({ performerId })
      .populate('enabledBuckets');

    // Create default config if none exists
    if (!config) {
      config = await this.createDefaultConfig(performerId);
    }

    return config;
  }

  /**
   * Updates the mood messaging configuration for a performer
   * @param performerId ID of the performer
   * @param dto Update data
   * @returns Updated configuration
   */
  async updateModelConfig(
    performerId: string,
    dto: UpdateModelConfigDto
  ): Promise<ModelMoodConfig> {
    // Validate enabled buckets exist
    if (dto.enabledBuckets && dto.enabledBuckets.length > 0) {
      const buckets = await this.moodBucketModel.find({
        _id: { $in: dto.enabledBuckets },
        active: true
      });

      if (buckets.length !== dto.enabledBuckets.length) {
        throw new BadRequestException('One or more enabled buckets do not exist or are inactive');
      }
    }

    // Validate custom responses bucket IDs
    if (dto.customResponses && dto.customResponses.length > 0) {
      const bucketIds = dto.customResponses.map((cr) => cr.bucketId);
      const buckets = await this.moodBucketModel.find({
        _id: { $in: bucketIds },
        active: true
      });

      if (buckets.length !== bucketIds.length) {
        throw new BadRequestException('One or more custom response buckets do not exist or are inactive');
      }
    }

    // Update or create configuration
    const config = await this.modelMoodConfigModel.findOneAndUpdate(
      { performerId },
      {
        $set: {
          ...(dto.enabledBuckets !== undefined && { enabledBuckets: dto.enabledBuckets }),
          ...(dto.customResponses !== undefined && { customResponses: dto.customResponses }),
          ...(dto.settings !== undefined && { settings: dto.settings }),
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    this.logger.log(`Model config updated for performer ${performerId}`);

    return config;
  }

  /**
   * Restores default configuration for a performer
   * @param performerId ID of the performer
   * @returns Default configuration
   */
  async restoreDefaults(performerId: string): Promise<ModelMoodConfig> {
    // Get all default buckets
    const defaultBuckets = await this.moodBucketModel.find({
      isDefault: true,
      active: true
    });

    const config = await this.modelMoodConfigModel.findOneAndUpdate(
      { performerId },
      {
        $set: {
          enabledBuckets: defaultBuckets.map((b) => b._id),
          customResponses: [],
          settings: {
            autoRespond: DEFAULT_AUTO_RESPOND,
            responseDelay: DEFAULT_RESPONSE_DELAY,
            dailyLimit: DEFAULT_DAILY_LIMIT
          },
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    this.logger.log(`Model config restored to defaults for performer ${performerId}`);

    return config;
  }

  /**
   * Creates default configuration for a performer
   * @param performerId ID of the performer
   * @returns Default configuration
   */
  private async createDefaultConfig(performerId: string): Promise<ModelMoodConfig> {
    // Get all default buckets
    const defaultBuckets = await this.moodBucketModel.find({
      isDefault: true,
      active: true
    });

    const config = new this.modelMoodConfigModel({
      performerId,
      enabledBuckets: defaultBuckets.map((b) => b._id),
      customResponses: [],
      settings: {
        autoRespond: DEFAULT_AUTO_RESPOND,
        responseDelay: DEFAULT_RESPONSE_DELAY,
        dailyLimit: DEFAULT_DAILY_LIMIT
      }
    });

    await config.save();

    this.logger.log(`Default model config created for performer ${performerId}`);

    return config;
  }

  /**
   * Selects a random item from an array using cryptographically secure randomization
   * Uses Node.js crypto.randomBytes() for secure random number generation
   * @param items Array of items to select from
   * @returns Randomly selected item
   */
  private selectSecureRandom<T>(items: T[]): T {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cannot select from empty array');
    }

    if (items.length === 1) {
      return items[0];
    }

    // Use cryptographically secure random bytes
    // Generate 4 bytes (32 bits) for the random number
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    
    // Use modulo to get index within array bounds
    const index = randomNumber % items.length;

    return items[index];
  }

  /**
   * Records usage history for analytics (async, no PII)
   * @param userId ID of the user receiving the response
   * @param performerId ID of the performer
   * @param bucketId ID of the bucket used
   * @param bucketName Name of the bucket
   * @param responseIndex Index of the selected response
   * @param context Optional context information
   */
  private async recordUsageHistory(
    userId: string,
    performerId: string,
    bucketId: string,
    bucketName: string,
    responseIndex: number,
    context?: MessageContextDto
  ): Promise<void> {
    try {
      const history = new this.userMessageHistoryModel({
        userId,
        performerId,
        bucketId,
        bucketName,
        responseIndex,
        context,
        timestamp: new Date()
      });

      await history.save();
    } catch (error) {
      // Don't throw - usage history is optional and shouldn't block response
      this.logger.error(`Failed to record usage history: ${error.message}`);
    }
  }
}
