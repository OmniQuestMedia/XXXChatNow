/**
 * Mood Message Service
 * 
 * Handles mood-based message delivery with tracking and audit trail.
 * Implements fully-trackable message delivery system with user tier-based routing.
 * 
 * Reference: MODEL_MOOD_RESPONSE_SYSTEM.md
 */

import { 
  Injectable, 
  Logger, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { MoodMessage } from '../schemas/mood-message.schema';
import { MessageTemplate } from '../schemas/message-template.schema';
import { User } from '../../user/schemas/user.schema';
import { SendMoodMessageDto } from '../dtos';

/**
 * Service for managing mood-based messages
 */
@Injectable()
export class MoodMessageService {
  private readonly logger = new Logger(MoodMessageService.name);

  // User tier to priority mapping
  private readonly TIER_PRIORITY_MAP = {
    vip: 10,
    premium: 8,
    basic: 5,
    free: 3
  };

  constructor(
    @InjectModel(MoodMessage.name) private readonly MoodMessageModel: Model<MoodMessage>,
    @InjectModel(MessageTemplate.name) private readonly MessageTemplateModel: Model<MessageTemplate>,
    @InjectModel(User.name) private readonly UserModel: Model<User>
  ) {}

  /**
   * Send a mood-based message to a user
   */
  async sendMessage(
    senderId: ObjectId,
    dto: SendMoodMessageDto
  ): Promise<any> {
    this.logger.log(`Sending mood message from ${senderId} to ${dto.user_id}`);

    // Validate recipient user exists
    const recipient = await this.UserModel.findById(dto.user_id).exec();
    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Determine user tier (default to 'free' if not set)
    const userTier = this.getUserTier(recipient);

    // Calculate priority based on user tier and provided priority
    const basePriority = this.TIER_PRIORITY_MAP[userTier] || 3;
    const finalPriority = dto.priority || basePriority;

    // Create message record
    const messageId = uuidv4();
    const message = new this.MoodMessageModel({
      message_id: messageId,
      user_id: new ObjectId(dto.user_id),
      model_id: senderId,
      message_type: dto.message_type,
      detected_mood: dto.detected_mood,
      mood_confidence: dto.mood_confidence,
      template_id: dto.template_id,
      content: dto.content,
      metadata: dto.metadata,
      user_tier: userTier,
      priority: finalPriority,
      status: 'pending',
      retry_count: 0,
      conversation_id: dto.conversation_id,
      is_automated: dto.message_type !== 'private_custom'
    });

    await message.save();

    this.logger.log(`Mood message created: ${messageId} with priority ${finalPriority}`);

    // TODO: Queue message for async delivery based on priority
    // Integration with performance-queue or message queue would go here
    // For now, mark as sent immediately
    await this.markAsSent(messageId);

    return {
      success: true,
      message_id: messageId,
      status: 'sent',
      estimated_delivery_seconds: this.getEstimatedDeliveryTime(finalPriority)
    };
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string, userId: ObjectId): Promise<any> {
    const message = await this.MoodMessageModel.findOne({
      message_id: messageId
    }).exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify access (user must be sender or recipient)
    const isAuthorized = 
      message.user_id.toString() === userId.toString() ||
      message.model_id?.toString() === userId.toString();

    if (!isAuthorized) {
      throw new BadRequestException('Unauthorized access to message');
    }

    return {
      message_id: message.message_id,
      status: message.status,
      sent_at: message.sent_at,
      delivered_at: message.delivered_at,
      read_at: message.read_at,
      failed_at: message.failed_at,
      failure_reason: message.failure_reason
    };
  }

  /**
   * Get message history for a user
   */
  async getMessageHistory(
    userId: ObjectId,
    limit = 50,
    offset = 0,
    messageType?: string,
    mood?: string
  ): Promise<any> {
    const query: any = {
      $or: [
        { user_id: userId },
        { model_id: userId }
      ]
    };

    if (messageType) {
      query.message_type = messageType;
    }

    if (mood) {
      query.detected_mood = mood;
    }

    const messages = await this.MoodMessageModel.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    const total = await this.MoodMessageModel.countDocuments(query).exec();

    return {
      messages,
      total,
      limit,
      offset
    };
  }

  /**
   * Get message analytics (admin only)
   */
  async getAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = startDate;
    if (endDate) dateQuery.$lte = endDate;

    const query: any = {};
    if (Object.keys(dateQuery).length > 0) {
      query.createdAt = dateQuery;
    }

    // Total messages
    const totalMessages = await this.MoodMessageModel.countDocuments(query).exec();

    // By mood
    const byMood = await this.MoodMessageModel.aggregate([
      { $match: query },
      { $group: { _id: '$detected_mood', count: { $sum: 1 } } }
    ]).exec();

    // By tier
    const byTier = await this.MoodMessageModel.aggregate([
      { $match: query },
      { $group: { _id: '$user_tier', count: { $sum: 1 } } }
    ]).exec();

    // By status
    const byStatus = await this.MoodMessageModel.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).exec();

    // Success rate
    const deliveredCount = byStatus.find(s => s._id === 'delivered')?.count || 0;
    const successRate = totalMessages > 0 
      ? ((deliveredCount / totalMessages) * 100).toFixed(2) 
      : 0;

    return {
      total_messages: totalMessages,
      by_mood: this.formatAggregateResult(byMood),
      by_tier: this.formatAggregateResult(byTier),
      by_status: this.formatAggregateResult(byStatus),
      delivery_success_rate: parseFloat(successRate as string)
    };
  }

  /**
   * Get or create message template
   */
  async getTemplate(
    mood: string,
    messageType: string,
    userTier = 'all'
  ): Promise<MessageTemplate | null> {
    const template = await this.MessageTemplateModel.findOne({
      mood,
      message_type: messageType,
      $or: [
        { target_tier: userTier },
        { target_tier: 'all' }
      ],
      is_active: true
    })
      .sort({ success_rate: -1, usage_count: -1 })
      .exec();

    if (template) {
      // Increment usage count
      await this.MessageTemplateModel.updateOne(
        { _id: template._id },
        { $inc: { usage_count: 1 } }
      ).exec();
    }

    return template;
  }

  /**
   * Mark message as sent
   */
  private async markAsSent(messageId: string): Promise<void> {
    await this.MoodMessageModel.updateOne(
      { message_id: messageId },
      { 
        $set: { 
          status: 'sent',
          sent_at: new Date()
        } 
      }
    ).exec();
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string): Promise<void> {
    await this.MoodMessageModel.updateOne(
      { message_id: messageId },
      { 
        $set: { 
          status: 'delivered',
          delivered_at: new Date()
        } 
      }
    ).exec();

    this.logger.log(`Message ${messageId} marked as delivered`);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: ObjectId): Promise<void> {
    const message = await this.MoodMessageModel.findOne({
      message_id: messageId,
      user_id: userId
    }).exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.MoodMessageModel.updateOne(
      { message_id: messageId },
      { 
        $set: { 
          status: 'read',
          read_at: new Date()
        } 
      }
    ).exec();

    this.logger.log(`Message ${messageId} marked as read by user ${userId}`);
  }

  /**
   * Mark message as failed
   */
  async markAsFailed(messageId: string, reason: string): Promise<void> {
    await this.MoodMessageModel.updateOne(
      { message_id: messageId },
      { 
        $set: { 
          status: 'failed',
          failed_at: new Date(),
          failure_reason: reason
        },
        $inc: { retry_count: 1 }
      }
    ).exec();

    this.logger.error(`Message ${messageId} marked as failed: ${reason}`);
  }

  /**
   * Get user tier from user object
   */
  private getUserTier(user: any): string {
    // This is a simplified implementation
    // In production, this would check subscription status, payment history, etc.
    return user.tier || user.userType || 'free';
  }

  /**
   * Get estimated delivery time based on priority
   */
  private getEstimatedDeliveryTime(priority: number): number {
    if (priority >= 10) return 0; // Immediate (VIP)
    if (priority >= 8) return 1;  // 1 second (Premium)
    if (priority >= 5) return 5;  // 5 seconds (Basic)
    return 30; // 30 seconds (Free)
  }

  /**
   * Format aggregate result to object
   */
  private formatAggregateResult(result: any[]): any {
    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }
}
