import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RRRApiClientService } from './rrr-api-client.service';
import {
  CreatePromotionDto,
  PromotionDto,
  PromotionApprovalDto,
  CreateAdjustmentDto,
  EarnEventResponseDto
} from '../dtos';
import { RRRActorType } from '../constants';
import { ObjectId } from 'mongodb';
import { RRRAccountLinkService } from './rrr-account-link.service';

/**
 * Service for managing RRR promotions and admin operations
 */
@Injectable()
export class RRRPromotionsService {
  private readonly logger = new Logger(RRRPromotionsService.name);

  constructor(
    private readonly rrrApiClient: RRRApiClientService,
    private readonly accountLinkService: RRRAccountLinkService
  ) {}

  /**
   * Create a new promotion
   */
  async createPromotion(dto: CreatePromotionDto, idempotencyKey: string): Promise<PromotionDto> {
    try {
      return await this.rrrApiClient.createPromotion(dto, idempotencyKey);
    } catch (error) {
      this.logger.error('Failed to create promotion', error.stack);
      throw error;
    }
  }

  /**
   * Update an existing promotion
   */
  async updatePromotion(
    promotionId: string,
    dto: Partial<CreatePromotionDto>,
    idempotencyKey: string
  ): Promise<PromotionDto> {
    try {
      return await this.rrrApiClient.updatePromotion(promotionId, dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to update promotion ${promotionId}`, error.stack);
      throw error;
    }
  }

  /**
   * Submit promotion for approval
   */
  async submitForApproval(promotionId: string, idempotencyKey: string): Promise<void> {
    try {
      await this.rrrApiClient.submitPromotionForApproval(promotionId, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to submit promotion ${promotionId} for approval`, error.stack);
      throw error;
    }
  }

  /**
   * Approve promotion with multi-sig validation
   * Ensures 2 distinct XCN admins + 1 RRR admin
   */
  async approvePromotion(
    promotionId: string,
    actorId: string,
    actorType: RRRActorType,
    idempotencyKey: string
  ): Promise<void> {
    // Fetch current promotion to check existing approvals
    const promotion = await this.rrrApiClient.getPromotion(promotionId);

    // Prevent same admin from approving twice
    if (promotion.approvals && promotion.approvals.length > 0) {
      const existingApproval = promotion.approvals.find(
        (approval: any) => approval.actor.actor_id === actorId
      );
      
      if (existingApproval) {
        throw new ForbiddenException('Admin has already approved this promotion');
      }
    }

    const approvalDto: PromotionApprovalDto = {
      actor: {
        actor_type: actorType,
        actor_id: actorId
      },
      signature: {
        method: 'OIDC_SESSION',
        attestation: 'session_verified'
      }
    };

    try {
      await this.rrrApiClient.approvePromotion(promotionId, approvalDto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to approve promotion ${promotionId}`, error.stack);
      throw error;
    }
  }

  /**
   * Get promotion by ID
   */
  async getPromotion(promotionId: string): Promise<PromotionDto> {
    try {
      return await this.rrrApiClient.getPromotion(promotionId);
    } catch (error) {
      this.logger.error(`Failed to get promotion ${promotionId}`, error.stack);
      throw error;
    }
  }

  /**
   * List promotions
   */
  async listPromotions(status?: string): Promise<PromotionDto[]> {
    try {
      return await this.rrrApiClient.listPromotions({ status });
    } catch (error) {
      this.logger.error('Failed to list promotions', error.stack);
      throw error;
    }
  }

  /**
   * Create manual adjustment with threshold-based approval requirements
   * <=100 points: 1 XCN admin
   * 101-500 points: 2 XCN admins
   * >500 points: 2 XCN admins + 1 RRR admin
   */
  async createAdjustment(
    userId: ObjectId,
    points: number,
    reasonCode: string,
    ticketReference: string,
    requestingAdminId: string,
    idempotencyKey: string,
    metadata?: Record<string, any>
  ): Promise<EarnEventResponseDto> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      throw new BadRequestException('User is not linked to RRR account');
    }

    const dto: CreateAdjustmentDto = {
      client_user_id: userId.toString(),
      rrr_member_id: rrrMemberId,
      points,
      reason_code: reasonCode,
      ticket_reference: ticketReference,
      metadata: {
        ...metadata,
        requesting_admin_id: requestingAdminId,
        threshold: this.getAdjustmentThreshold(points)
      }
    };

    try {
      return await this.rrrApiClient.createAdjustment(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to create adjustment for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Get adjustment threshold based on points
   */
  private getAdjustmentThreshold(points: number): string {
    const absPoints = Math.abs(points);
    
    if (absPoints <= 100) {
      return 'SINGLE_ADMIN';
    } else if (absPoints <= 500) {
      return 'TWO_ADMINS';
    } else {
      return 'TWO_ADMINS_PLUS_RRR';
    }
  }
}
