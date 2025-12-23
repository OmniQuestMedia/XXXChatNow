import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { RRRApiClientService } from './rrr-api-client.service';
import { RRRAccountLinkService } from './rrr-account-link.service';
import {
  PostEarnEventDto,
  EarnEventResponseDto,
  QuoteRedemptionDto,
  QuoteRedemptionResponseDto,
  CommitRedemptionDto,
  ReverseRedemptionDto,
  RRRWalletDto,
  QuoteTopUpDto,
  QuoteTopUpResponseDto,
  CommitTopUpDto,
  CreateAwardIntentDto,
  AwardIntentResponseDto,
  CommitAwardDto
} from '../dtos';
import { RRREarnEventType, RRRPostingMode, RRRRedemptionMode, RRRReversalReason } from '../constants';

/**
 * Service for managing loyalty points earning and redemption
 */
@Injectable()
export class RRRPointsService {
  private readonly logger = new Logger(RRRPointsService.name);

  constructor(
    private readonly rrrApiClient: RRRApiClientService,
    private readonly accountLinkService: RRRAccountLinkService
  ) {}

  /**
   * Get wallet balance for a user
   */
  async getUserWallet(userId: ObjectId): Promise<RRRWalletDto | null> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      return null;
    }

    try {
      return await this.rrrApiClient.getWallet(rrrMemberId);
    } catch (error) {
      this.logger.error(`Failed to fetch wallet for user ${userId}`, error.stack);
      return null;
    }
  }

  /**
   * Post earn event for token purchase
   */
  async earnFromTokenPurchase(
    userId: ObjectId,
    orderId: string,
    currency: string,
    amountMinor: number,
    points: number,
    idempotencyKey: string,
    metadata?: Record<string, any>
  ): Promise<EarnEventResponseDto> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      throw new BadRequestException('User is not linked to RRR account');
    }

    const dto: PostEarnEventDto = {
      client_user_id: userId.toString(),
      rrr_member_id: rrrMemberId,
      source: {
        event_type: RRREarnEventType.TOKEN_PURCHASE,
        order_id: orderId,
        line_id: '1'
      },
      currency,
      amount_minor: amountMinor,
      points,
      policy: {
        posting_mode: RRRPostingMode.POSTED
      },
      metadata
    };

    try {
      return await this.rrrApiClient.postEarnEvent(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to post earn event for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Post earn event for membership purchase
   */
  async earnFromMembershipPurchase(
    userId: ObjectId,
    orderId: string,
    currency: string,
    amountMinor: number,
    points: number,
    idempotencyKey: string,
    membershipTier?: string
  ): Promise<EarnEventResponseDto> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      throw new BadRequestException('User is not linked to RRR account');
    }

    const dto: PostEarnEventDto = {
      client_user_id: userId.toString(),
      rrr_member_id: rrrMemberId,
      source: {
        event_type: RRREarnEventType.MEMBERSHIP_PURCHASE,
        order_id: orderId,
        line_id: '1'
      },
      currency,
      amount_minor: amountMinor,
      points,
      policy: {
        posting_mode: RRRPostingMode.POSTED
      },
      metadata: {
        xcn_membership_tier: membershipTier
      }
    };

    try {
      return await this.rrrApiClient.postEarnEvent(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to post earn event for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Quote redemption for checkout
   */
  async quoteRedemption(
    userId: ObjectId,
    cartTotalMinor: number,
    currency: string,
    mode: RRRRedemptionMode,
    requestedPoints?: number
  ): Promise<QuoteRedemptionResponseDto> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      throw new BadRequestException('User is not linked to RRR account');
    }

    const dto: QuoteRedemptionDto = {
      client_user_id: userId.toString(),
      rrr_member_id: rrrMemberId,
      cart: {
        currency,
        total_minor: cartTotalMinor,
        items: [
          {
            sku: 'CART_TOTAL',
            qty: 1,
            minor: cartTotalMinor
          }
        ]
      },
      requested: {
        mode,
        points: requestedPoints
      }
    };

    try {
      return await this.rrrApiClient.quoteRedemption(dto);
    } catch (error) {
      this.logger.error(`Failed to quote redemption for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Commit redemption
   */
  async commitRedemption(
    userId: ObjectId,
    quoteId: string,
    orderId: string,
    idempotencyKey: string
  ): Promise<void> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      throw new BadRequestException('User is not linked to RRR account');
    }

    const dto: CommitRedemptionDto = {
      quote_id: quoteId,
      client_order_id: orderId,
      client_user_id: userId.toString(),
      rrr_member_id: rrrMemberId
    };

    try {
      await this.rrrApiClient.commitRedemption(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to commit redemption for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Reverse redemption (for failed orders)
   */
  async reverseRedemption(
    orderId: string,
    reason: RRRReversalReason,
    idempotencyKey: string
  ): Promise<void> {
    const dto: ReverseRedemptionDto = {
      client_order_id: orderId,
      reason
    };

    try {
      await this.rrrApiClient.reverseRedemption(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to reverse redemption for order ${orderId}`, error.stack);
      throw error;
    }
  }

  /**
   * Quote top-up (for checkout when user is short of points)
   */
  async quoteTopUp(
    bundle: number,
    unitPriceMinor = 3
  ): Promise<QuoteTopUpResponseDto> {
    const dto: QuoteTopUpDto = {
      bundle,
      unit_price_minor: unitPriceMinor
    };

    try {
      return await this.rrrApiClient.quoteTopUp(dto);
    } catch (error) {
      this.logger.error(`Failed to quote top-up for bundle ${bundle}`, error.stack);
      throw error;
    }
  }

  /**
   * Commit top-up after payment success
   */
  async commitTopUp(
    userId: ObjectId,
    topupQuoteId: string,
    orderId: string,
    idempotencyKey: string
  ): Promise<void> {
    const rrrMemberId = await this.accountLinkService.getRRRMemberId(userId);
    
    if (!rrrMemberId) {
      throw new BadRequestException('User is not linked to RRR account');
    }

    const dto: CommitTopUpDto = {
      topup_quote_id: topupQuoteId,
      client_order_id: orderId,
      client_user_id: userId.toString(),
      rrr_member_id: rrrMemberId
    };

    try {
      await this.rrrApiClient.commitTopUp(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to commit top-up for user ${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * Create award intent (model to viewer)
   */
  async createAwardIntent(
    modelUserId: ObjectId,
    viewerUserId: ObjectId,
    points: number,
    context?: { room_id?: string; stream_id?: string }
  ): Promise<AwardIntentResponseDto> {
    const modelRRRMemberId = await this.accountLinkService.getRRRMemberId(modelUserId);
    const viewerRRRMemberId = await this.accountLinkService.getRRRMemberId(viewerUserId);
    
    if (!modelRRRMemberId) {
      throw new BadRequestException('Model is not linked to RRR account');
    }
    
    if (!viewerRRRMemberId) {
      throw new BadRequestException('Viewer is not linked to RRR account');
    }

    const dto: CreateAwardIntentDto = {
      client_model_id: modelUserId.toString(),
      rrr_model_member_id: modelRRRMemberId,
      client_viewer_user_id: viewerUserId.toString(),
      rrr_viewer_member_id: viewerRRRMemberId,
      points,
      context
    };

    try {
      return await this.rrrApiClient.createAwardIntent(dto);
    } catch (error) {
      this.logger.error(`Failed to create award intent from model ${modelUserId} to viewer ${viewerUserId}`, error.stack);
      throw error;
    }
  }

  /**
   * Commit award
   */
  async commitAward(
    modelUserId: ObjectId,
    viewerUserId: ObjectId,
    intentId: string,
    idempotencyKey: string
  ): Promise<void> {
    const dto: CommitAwardDto = {
      intent_id: intentId,
      client_model_id: modelUserId.toString(),
      client_viewer_user_id: viewerUserId.toString()
    };

    try {
      await this.rrrApiClient.commitAward(dto, idempotencyKey);
    } catch (error) {
      this.logger.error(`Failed to commit award from model ${modelUserId} to viewer ${viewerUserId}`, error.stack);
      throw error;
    }
  }
}
