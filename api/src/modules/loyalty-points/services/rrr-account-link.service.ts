import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { RRRAccountLink, RRRAccountLinkDocument } from '../schemas';
import { RRRApiClientService } from './rrr-api-client.service';
import { RRRLinkType, RRRLinkStatus } from '../constants';
import { CreateLinkIntentDto, ConfirmLinkDto, LinkStatusDto } from '../dtos';

/**
 * Service for managing RRR account linking
 */
@Injectable()
export class RRRAccountLinkService {
  private readonly logger = new Logger(RRRAccountLinkService.name);

  constructor(
    @InjectModel(RRRAccountLink.name)
    private readonly accountLinkModel: Model<RRRAccountLinkDocument>,
    private readonly rrrApiClient: RRRApiClientService
  ) {}

  /**
   * Create a link intent for a user
   */
  async createLinkIntent(
    userId: ObjectId,
    linkType: RRRLinkType
  ): Promise<{ intent_id: string; rrr_link_code: string; expires_at: string }> {
    // Check if user already has an active link
    const existingLink = await this.accountLinkModel.findOne({
      userId,
      status: RRRLinkStatus.ACTIVE
    });

    if (existingLink) {
      throw new BadRequestException('User already has an active RRR account link');
    }

    const dto: CreateLinkIntentDto = {
      client_user_id: userId.toString(),
      link_type: linkType
    };

    const response = await this.rrrApiClient.createLinkIntent(dto);

    // Store the intent locally (for tracking purposes)
    await this.accountLinkModel.create({
      userId,
      rrrMemberId: '', // Will be filled when confirmed
      linkType,
      status: RRRLinkStatus.PENDING,
      intentId: response.intent_id,
      linkCode: response.rrr_link_code,
      expiresAt: new Date(response.expires_at),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return response;
  }

  /**
   * Confirm a link
   */
  async confirmLink(userId: ObjectId, dto: ConfirmLinkDto): Promise<void> {
    // Find the pending link
    const link = await this.accountLinkModel.findOne({
      userId,
      intentId: dto.intent_id,
      status: RRRLinkStatus.PENDING
    });

    if (!link) {
      throw new NotFoundException('Link intent not found or already confirmed');
    }

    // Check if RRR member is already linked to another XCN user
    const existingMemberLink = await this.accountLinkModel.findOne({
      rrrMemberId: dto.rrr_member_id,
      status: RRRLinkStatus.ACTIVE
    });

    if (existingMemberLink && !existingMemberLink.userId.equals(userId)) {
      throw new BadRequestException('RRR member already linked to another user');
    }

    // Confirm with RRR
    await this.rrrApiClient.confirmLink(dto);

    // Update local link status
    link.rrrMemberId = dto.rrr_member_id;
    link.status = RRRLinkStatus.ACTIVE;
    link.linkedAt = new Date();
    link.updatedAt = new Date();
    await link.save();

    this.logger.log(`User ${userId} successfully linked to RRR member ${dto.rrr_member_id}`);
  }

  /**
   * Get link status for a user
   */
  async getLinkStatus(userId: ObjectId): Promise<LinkStatusDto> {
    const link = await this.accountLinkModel.findOne({
      userId,
      status: RRRLinkStatus.ACTIVE
    });

    if (!link) {
      return {
        linked: false
      };
    }

    return {
      linked: true,
      rrr_member_id: link.rrrMemberId,
      link_type: link.linkType,
      linked_at: link.linkedAt?.toISOString()
    };
  }

  /**
   * Get RRR member ID for a user
   */
  async getRRRMemberId(userId: ObjectId): Promise<string | null> {
    const link = await this.accountLinkModel.findOne({
      userId,
      status: RRRLinkStatus.ACTIVE
    });

    return link ? link.rrrMemberId : null;
  }

  /**
   * Revoke a link
   */
  async revokeLink(userId: ObjectId): Promise<void> {
    const link = await this.accountLinkModel.findOne({
      userId,
      status: RRRLinkStatus.ACTIVE
    });

    if (!link) {
      throw new NotFoundException('No active link found for user');
    }

    link.status = RRRLinkStatus.REVOKED;
    link.updatedAt = new Date();
    await link.save();

    this.logger.log(`Link revoked for user ${userId}`);
  }

  /**
   * Check if user is linked
   */
  async isUserLinked(userId: ObjectId): Promise<boolean> {
    const count = await this.accountLinkModel.countDocuments({
      userId,
      status: RRRLinkStatus.ACTIVE
    });

    return count > 0;
  }
}
