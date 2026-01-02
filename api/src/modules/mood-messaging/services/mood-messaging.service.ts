import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  MoodBucket,
  MoodBucketDocument,
  TierBucketMapping,
  TierBucketMappingDocument,
  PublicMicroGratitude,
  PublicMicroGratitudeDocument,
  MoodMessageHistory,
  MoodMessageHistoryDocument
} from '../schemas';

@Injectable()
export class MoodMessagingService {
  private readonly logger = new Logger(MoodMessagingService.name);
  private readonly NON_REPETITION_CYCLE = 5;

  constructor(
    @InjectModel(MoodBucket.name)
    private moodBucketModel: Model<MoodBucketDocument>,
    @InjectModel(TierBucketMapping.name)
    private tierBucketMappingModel: Model<TierBucketMappingDocument>,
    @InjectModel(PublicMicroGratitude.name)
    private publicMicroGratitudeModel: Model<PublicMicroGratitudeDocument>,
    @InjectModel(MoodMessageHistory.name)
    private moodMessageHistoryModel: Model<MoodMessageHistoryDocument>
  ) {}

  /**
   * Get a random private mood message for a user based on their tier
   * @param userId - User ID
   * @param tierKey - User's membership tier key (e.g., 'guest', 'gold_vip')
   * @param username - Username to substitute for <user> placeholder
   * @returns Promise<string> - The mood message with username substituted
   */
  async getPrivateMoodMessage(
    userId: ObjectId | string,
    tierKey: string,
    username: string
  ): Promise<string> {
    try {
      // Get tier mapping
      const tierMapping = await this.tierBucketMappingModel.findOne({ tierKey });
      if (!tierMapping) {
        this.logger.warn(`Tier mapping not found for tier: ${tierKey}, using guest`);
        return this.getPrivateMoodMessage(userId, 'guest', username);
      }

      // Get available buckets for this tier
      const availableBuckets = tierMapping.buckets;
      if (!availableBuckets || availableBuckets.length === 0) {
        throw new Error('No buckets available for tier');
      }

      // Randomly select a bucket
      const randomBucket = availableBuckets[Math.floor(Math.random() * availableBuckets.length)];

      // Get the bucket data
      const bucket = await this.moodBucketModel.findOne({ key: randomBucket });
      if (!bucket || !bucket.responses || bucket.responses.length === 0) {
        throw new Error(`Bucket ${randomBucket} not found or has no responses`);
      }

      // Get message history for non-repetitive selection
      const history = await this.getOrCreateHistory(
        userId,
        'private_mood',
        randomBucket
      );

      // Select a response that hasn't been used recently
      const selectedIndex = this.selectNonRepetitiveIndex(
        bucket.responses.length,
        history.usedResponseIndices
      );

      // Update history
      await this.updateHistory(history, selectedIndex);

      // Get the response and substitute username
      const response = bucket.responses[selectedIndex];
      return this.substitutePlaceholder(response, username);
    } catch (error) {
      this.logger.error(`Error getting private mood message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a public micro-gratitude message
   * @param userId - User ID
   * @returns Promise<string> - The gratitude message
   */
  async getPublicMicroGratitudeMessage(userId: ObjectId | string): Promise<string> {
    try {
      // Get all gratitude messages
      const gratitudeMessages = await this.publicMicroGratitudeModel.find().sort({ responseId: 1 });
      if (!gratitudeMessages || gratitudeMessages.length === 0) {
        throw new Error('No public micro-gratitude messages found');
      }

      // Get message history for non-repetitive selection
      const history = await this.getOrCreateHistory(
        userId,
        'public_micro_gratitude',
        'public_micro_gratitude'
      );

      // Select a response that hasn't been used recently
      const selectedIndex = this.selectNonRepetitiveIndex(
        gratitudeMessages.length,
        history.usedResponseIndices
      );

      // Update history
      await this.updateHistory(history, selectedIndex);

      // Return the selected message
      return gratitudeMessages[selectedIndex].text;
    } catch (error) {
      this.logger.error(`Error getting public micro-gratitude message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get or create message history for a user
   */
  private async getOrCreateHistory(
    userId: ObjectId | string,
    messageType: string,
    bucketKey: string
  ): Promise<MoodMessageHistoryDocument> {
    let history = await this.moodMessageHistoryModel.findOne({
      userId,
      messageType,
      bucketKey
    });

    if (!history) {
      history = await this.moodMessageHistoryModel.create({
        userId,
        messageType,
        bucketKey,
        usedResponseIndices: [],
        cycleCount: 0,
        lastUsedAt: new Date()
      });
    }

    return history;
  }

  /**
   * Select a non-repetitive index from available responses
   * Ensures no message repeats within the last 5 uses per user
   */
  private selectNonRepetitiveIndex(
    totalResponses: number,
    usedIndices: number[]
  ): number {
    // Get indices that haven't been used recently
    const availableIndices = Array.from(
      { length: totalResponses },
      (_, i) => i
    ).filter(i => !usedIndices.includes(i));

    // If all have been used, reset and use any
    if (availableIndices.length === 0) {
      return Math.floor(Math.random() * totalResponses);
    }

    // Randomly select from available indices
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  /**
   * Update message history after using a response
   */
  private async updateHistory(
    history: MoodMessageHistoryDocument,
    usedIndex: number
  ): Promise<void> {
    // Add the used index to the history
    history.usedResponseIndices.push(usedIndex);

    // Keep only the last N uses (non-repetition cycle)
    if (history.usedResponseIndices.length > this.NON_REPETITION_CYCLE) {
      history.usedResponseIndices = history.usedResponseIndices.slice(-this.NON_REPETITION_CYCLE);
    }

    history.cycleCount += 1;
    history.lastUsedAt = new Date();
    history.updatedAt = new Date();

    await history.save();
  }

  /**
   * Substitute <user> placeholder with actual username
   */
  private substitutePlaceholder(message: string, username: string): string {
    return message.replace(/<user>/g, username);
  }

  /**
   * Get available buckets for a tier
   */
  async getAvailableBucketsForTier(tierKey: string): Promise<string[]> {
    const tierMapping = await this.tierBucketMappingModel.findOne({ tierKey });
    if (!tierMapping) {
      return [];
    }
    return tierMapping.buckets;
  }

  /**
   * Check if a tier has secondary micro access
   */
  async hasSecondaryMicroAccess(tierKey: string): Promise<boolean> {
    const tierMapping = await this.tierBucketMappingModel.findOne({ tierKey });
    if (!tierMapping) {
      return false;
    }
    return tierMapping.hasSecondaryMicro;
  }
}
