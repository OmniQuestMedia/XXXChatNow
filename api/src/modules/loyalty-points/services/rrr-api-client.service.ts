import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from 'nestjs-config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  RRR_API_BASE_URL,
  RRR_API_VERSION,
  RRR_CLIENT_ID
} from '../constants';
import {
  CreateLinkIntentDto,
  LinkIntentResponseDto,
  ConfirmLinkDto,
  LinkStatusDto,
  PostEarnEventDto,
  EarnEventResponseDto,
  QuoteRedemptionDto,
  QuoteRedemptionResponseDto,
  CommitRedemptionDto,
  ReverseRedemptionDto,
  RRRWalletDto,
  RRRLedgerEntryDto,
  QuoteTopUpDto,
  QuoteTopUpResponseDto,
  CommitTopUpDto,
  CreateAwardIntentDto,
  AwardIntentResponseDto,
  CommitAwardDto,
  CreatePromotionDto,
  PromotionDto,
  PromotionApprovalDto,
  CreateAdjustmentDto
} from '../dtos';

/**
 * RRR API Client Service
 * Handles all HTTP communication with RedRoomRewards API
 * Implements OAuth 2.0 client credentials flow and idempotency
 */
@Injectable()
export class RRRApiClientService {
  private readonly logger = new Logger(RRRApiClientService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get('rrr.apiBaseUrl') || RRR_API_BASE_URL;
    this.clientId = this.configService.get('rrr.clientId') || RRR_CLIENT_ID;
  }

  /**
   * Get access token using OAuth 2.0 client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiresAt > Date.now() + 300000) {
      return this.accessToken;
    }

    try {
      const clientSecret = this.configService.get('rrr.clientSecret');
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/oauth/token`,
          {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: clientSecret
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to obtain RRR access token', error.stack);
      throw new Error('RRR authentication failed');
    }
  }

  /**
   * Generate common headers for RRR API requests
   */
  private async getHeaders(idempotencyKey?: string): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'X-Client-Id': this.clientId,
      'X-Request-Trace': uuidv4(),
      'Content-Type': 'application/json'
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  /**
   * Handle RRR API errors
   */
  private handleError(error: any): never {
    if (error.response) {
      const { status, data } = error.response;
      const errorData = data?.error || {};
      
      this.logger.error(
        `RRR API Error: ${status} - ${errorData.code || 'UNKNOWN'}`,
        JSON.stringify({ 
          status, 
          code: errorData.code, 
          message: errorData.message,
          // Do not log details as they may contain PII
        })
      );

      throw new Error(errorData.message || 'RRR API request failed');
    }

    this.logger.error('RRR API request failed', error.stack);
    throw new Error('RRR API request failed');
  }

  /**
   * Create link intent
   */
  async createLinkIntent(dto: CreateLinkIntentDto): Promise<LinkIntentResponseDto> {
    try {
      const headers = await this.getHeaders(uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/links/intents`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Confirm link
   */
  async confirmLink(dto: ConfirmLinkDto): Promise<void> {
    try {
      const headers = await this.getHeaders(uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/links/confirm`,
          dto,
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get link status
   */
  async getLinkStatus(clientUserId: string): Promise<LinkStatusDto> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${RRR_API_VERSION}/links/status`,
          {
            headers,
            params: { client_user_id: clientUserId }
          }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get wallet summary
   */
  async getWallet(rrrMemberId: string): Promise<RRRWalletDto> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${RRR_API_VERSION}/members/${rrrMemberId}/wallet`,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get ledger entries
   */
  async getLedger(
    rrrMemberId: string,
    params?: { from?: string; to?: string; type?: string }
  ): Promise<RRRLedgerEntryDto[]> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${RRR_API_VERSION}/members/${rrrMemberId}/ledger`,
          {
            headers,
            params
          }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Post earn event
   */
  async postEarnEvent(dto: PostEarnEventDto, idempotencyKey?: string): Promise<EarnEventResponseDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/points/earn`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Quote redemption
   */
  async quoteRedemption(dto: QuoteRedemptionDto, idempotencyKey?: string): Promise<QuoteRedemptionResponseDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/redemptions/quote`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Commit redemption
   */
  async commitRedemption(dto: CommitRedemptionDto, idempotencyKey?: string): Promise<void> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/redemptions/commit`,
          dto,
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Reverse redemption
   */
  async reverseRedemption(dto: ReverseRedemptionDto, idempotencyKey?: string): Promise<void> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/redemptions/reverse`,
          dto,
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Quote top-up
   */
  async quoteTopUp(dto: QuoteTopUpDto, idempotencyKey?: string): Promise<QuoteTopUpResponseDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/points/topup/quote`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Commit top-up
   */
  async commitTopUp(dto: CommitTopUpDto, idempotencyKey?: string): Promise<void> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/points/topup/commit`,
          dto,
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create award intent (model to viewer)
   */
  async createAwardIntent(dto: CreateAwardIntentDto, idempotencyKey?: string): Promise<AwardIntentResponseDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/awards/intents`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Commit award
   */
  async commitAward(dto: CommitAwardDto, idempotencyKey?: string): Promise<void> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/awards/commit`,
          dto,
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create promotion
   */
  async createPromotion(dto: CreatePromotionDto, idempotencyKey?: string): Promise<PromotionDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/promotions`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update promotion
   */
  async updatePromotion(promotionId: string, dto: Partial<CreatePromotionDto>, idempotencyKey?: string): Promise<PromotionDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/${RRR_API_VERSION}/promotions/${promotionId}`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Submit promotion for approval
   */
  async submitPromotionForApproval(promotionId: string, idempotencyKey?: string): Promise<void> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/promotions/${promotionId}/submit`,
          {},
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Approve promotion
   */
  async approvePromotion(promotionId: string, dto: PromotionApprovalDto, idempotencyKey?: string): Promise<void> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/promotions/${promotionId}/approve`,
          dto,
          { headers }
        )
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get promotion
   */
  async getPromotion(promotionId: string): Promise<PromotionDto> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${RRR_API_VERSION}/promotions/${promotionId}`,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List promotions
   */
  async listPromotions(params?: { status?: string }): Promise<PromotionDto[]> {
    try {
      const headers = await this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/${RRR_API_VERSION}/promotions`,
          {
            headers,
            params
          }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create manual adjustment
   */
  async createAdjustment(dto: CreateAdjustmentDto, idempotencyKey?: string): Promise<EarnEventResponseDto> {
    try {
      const headers = await this.getHeaders(idempotencyKey || uuidv4());
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/${RRR_API_VERSION}/points/adjustments`,
          dto,
          { headers }
        )
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}
