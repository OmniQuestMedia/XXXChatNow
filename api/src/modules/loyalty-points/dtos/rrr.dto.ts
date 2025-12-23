import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsUUID, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import {
  RRRLinkType,
  RRRLedgerEntryType,
  RRREarnEventType,
  RRRPostingMode,
  RRRRedemptionMode,
  RRRReversalReason,
  RRRProofMethod
} from '../constants';

/**
 * RRR Member Wallet DTO
 */
export class RRRExpiringPointsDto {
  @ApiProperty()
  @IsNumber()
  points: number;

  @ApiProperty()
  @IsISO8601()
  expires_at: string;
}

export class RRRWalletDto {
  @ApiProperty()
  @IsUUID()
  member_id: string;

  @ApiProperty()
  @IsNumber()
  available_points: number;

  @ApiProperty()
  @IsNumber()
  escrow_points: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  pending_points?: number;

  @ApiProperty({ type: [RRRExpiringPointsDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RRRExpiringPointsDto)
  expiring_soon: RRRExpiringPointsDto[];

  @ApiProperty()
  @IsISO8601()
  as_of: string;
}

/**
 * RRR Ledger Entry DTO
 */
export class RRRActorDto {
  @ApiProperty({ enum: ['MEMBER', 'MODEL', 'CLIENT_ADMIN', 'RRR_ADMIN', 'SERVICE'] })
  @IsString()
  actor_type: string;

  @ApiProperty()
  @IsString()
  actor_id: string;
}

export class RRRLedgerEntryDto {
  @ApiProperty()
  @IsUUID()
  entry_id: string;

  @ApiProperty()
  @IsUUID()
  member_id: string;

  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty({ enum: RRRLedgerEntryType })
  @IsEnum(RRRLedgerEntryType)
  type: RRRLedgerEntryType;

  @ApiProperty()
  @IsNumber()
  points_delta: number;

  @ApiProperty()
  @IsNumber()
  balance_after: number;

  @ApiProperty()
  @IsString()
  reason_code: string;

  @ApiProperty()
  @IsString()
  source_ref: string;

  @ApiProperty()
  @IsISO8601()
  created_at: string;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  posted_at?: string;

  @ApiProperty({ type: RRRActorDto })
  @ValidateNested()
  @Type(() => RRRActorDto)
  actor: RRRActorDto;
}

/**
 * Link Intent DTOs
 */
export class CreateLinkIntentDto {
  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty({ enum: RRRLinkType })
  @IsEnum(RRRLinkType)
  link_type: RRRLinkType;
}

export class LinkIntentResponseDto {
  @ApiProperty()
  @IsUUID()
  intent_id: string;

  @ApiProperty()
  @IsISO8601()
  expires_at: string;

  @ApiProperty()
  @IsString()
  rrr_link_code: string;
}

/**
 * Confirm Link DTOs
 */
export class LinkProofDto {
  @ApiProperty({ enum: RRRProofMethod })
  @IsEnum(RRRProofMethod)
  method: RRRProofMethod;

  @ApiProperty()
  @IsString()
  assertion: string;
}

export class ConfirmLinkDto {
  @ApiProperty()
  @IsUUID()
  intent_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_member_id: string;

  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty({ type: LinkProofDto })
  @ValidateNested()
  @Type(() => LinkProofDto)
  proof: LinkProofDto;
}

/**
 * Link Status DTOs
 */
export class LinkStatusDto {
  @ApiProperty()
  @IsBoolean()
  linked: boolean;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  rrr_member_id?: string;

  @ApiProperty({ enum: RRRLinkType })
  @IsEnum(RRRLinkType)
  @IsOptional()
  link_type?: RRRLinkType;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  linked_at?: string;
}

/**
 * Earn Event DTOs
 */
export class EarnSourceDto {
  @ApiProperty({ enum: RRREarnEventType })
  @IsEnum(RRREarnEventType)
  event_type: RRREarnEventType;

  @ApiProperty()
  @IsString()
  order_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  line_id?: string;
}

export class EarnPolicyDto {
  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  expires_at?: string;

  @ApiProperty({ enum: RRRPostingMode })
  @IsEnum(RRRPostingMode)
  posting_mode: RRRPostingMode;
}

export class PostEarnEventDto {
  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_member_id: string;

  @ApiProperty({ type: EarnSourceDto })
  @ValidateNested()
  @Type(() => EarnSourceDto)
  source: EarnSourceDto;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNumber()
  amount_minor: number;

  @ApiProperty()
  @IsNumber()
  points: number;

  @ApiProperty({ type: EarnPolicyDto })
  @ValidateNested()
  @Type(() => EarnPolicyDto)
  policy: EarnPolicyDto;

  @ApiProperty()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class EarnEventResponseDto {
  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsUUID()
  ledger_entry_id: string;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  posted_at?: string;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  pending_until?: string;
}

/**
 * Redemption DTOs
 */
export class RedemptionCartItemDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsNumber()
  qty: number;

  @ApiProperty()
  @IsNumber()
  minor: number;
}

export class RedemptionCartDto {
  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNumber()
  total_minor: number;

  @ApiProperty({ type: [RedemptionCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RedemptionCartItemDto)
  items: RedemptionCartItemDto[];
}

export class RedemptionRequestDto {
  @ApiProperty({ enum: RRRRedemptionMode })
  @IsEnum(RRRRedemptionMode)
  mode: RRRRedemptionMode;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  points?: number;
}

export class QuoteRedemptionDto {
  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_member_id: string;

  @ApiProperty({ type: RedemptionCartDto })
  @ValidateNested()
  @Type(() => RedemptionCartDto)
  cart: RedemptionCartDto;

  @ApiProperty({ type: RedemptionRequestDto })
  @ValidateNested()
  @Type(() => RedemptionRequestDto)
  requested: RedemptionRequestDto;
}

export class RedemptionQuoteDto {
  @ApiProperty()
  @IsNumber()
  points_to_burn: number;

  @ApiProperty()
  @IsNumber()
  discount_minor: number;
}

export class QuoteRedemptionResponseDto {
  @ApiProperty()
  @IsBoolean()
  eligible: boolean;

  @ApiProperty()
  @IsNumber()
  min_points: number;

  @ApiProperty()
  @IsNumber()
  max_points: number;

  @ApiProperty({ type: RedemptionQuoteDto })
  @ValidateNested()
  @Type(() => RedemptionQuoteDto)
  quote: RedemptionQuoteDto;

  @ApiProperty()
  @IsUUID()
  quote_id: string;

  @ApiProperty()
  @IsISO8601()
  expires_at: string;
}

export class CommitRedemptionDto {
  @ApiProperty()
  @IsUUID()
  quote_id: string;

  @ApiProperty()
  @IsString()
  client_order_id: string;

  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_member_id: string;
}

export class ReverseRedemptionDto {
  @ApiProperty()
  @IsString()
  client_order_id: string;

  @ApiProperty({ enum: RRRReversalReason })
  @IsEnum(RRRReversalReason)
  reason: RRRReversalReason;
}

/**
 * Top-Up DTOs
 */
export class QuoteTopUpDto {
  @ApiProperty()
  @IsNumber()
  bundle: number;

  @ApiProperty()
  @IsNumber()
  unit_price_minor: number;
}

export class QuoteTopUpResponseDto {
  @ApiProperty()
  @IsUUID()
  topup_quote_id: string;

  @ApiProperty()
  @IsNumber()
  points: number;

  @ApiProperty()
  @IsNumber()
  total_cost_minor: number;

  @ApiProperty()
  @IsISO8601()
  expires_at: string;
}

export class CommitTopUpDto {
  @ApiProperty()
  @IsUUID()
  topup_quote_id: string;

  @ApiProperty()
  @IsString()
  client_order_id: string;

  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_member_id: string;
}

/**
 * Award DTOs (Model to Viewer)
 */
export class AwardContextDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  room_id?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  stream_id?: string;
}

export class CreateAwardIntentDto {
  @ApiProperty()
  @IsString()
  client_model_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_model_member_id: string;

  @ApiProperty()
  @IsString()
  client_viewer_user_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_viewer_member_id: string;

  @ApiProperty()
  @IsNumber()
  points: number;

  @ApiProperty({ type: AwardContextDto })
  @ValidateNested()
  @Type(() => AwardContextDto)
  @IsOptional()
  context?: AwardContextDto;
}

export class AwardIntentResponseDto {
  @ApiProperty()
  @IsUUID()
  intent_id: string;

  @ApiProperty()
  @IsBoolean()
  eligible: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ineligibility_reason?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  max_points?: number;
}

export class CommitAwardDto {
  @ApiProperty()
  @IsUUID()
  intent_id: string;

  @ApiProperty()
  @IsString()
  client_model_id: string;

  @ApiProperty()
  @IsString()
  client_viewer_user_id: string;
}

/**
 * Promotion DTOs
 */
export class PromotionEligibilityDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  xcn_membership_tiers?: string[];

  @ApiProperty()
  @IsOptional()
  min_lifetime_spend_minor?: number;
}

export class PromotionEarnRulesDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  multiplier?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  cap_points?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  expiry_days?: number;
}

export class CreatePromotionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: PromotionEligibilityDto })
  @ValidateNested()
  @Type(() => PromotionEligibilityDto)
  @IsOptional()
  eligibility?: PromotionEligibilityDto;

  @ApiProperty({ type: PromotionEarnRulesDto })
  @ValidateNested()
  @Type(() => PromotionEarnRulesDto)
  @IsOptional()
  earn_rules?: PromotionEarnRulesDto;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  starts_at?: string;

  @ApiProperty()
  @IsISO8601()
  @IsOptional()
  ends_at?: string;
}

export class PromotionApprovalDto {
  @ApiProperty({ type: RRRActorDto })
  @ValidateNested()
  @Type(() => RRRActorDto)
  actor: RRRActorDto;

  @ApiProperty()
  @IsOptional()
  signature?: {
    method: string;
    attestation: string;
  };
}

export class PromotionDto {
  @ApiProperty()
  @IsUUID()
  promotion_id: string;

  @ApiProperty()
  @IsString()
  client_id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty({ type: PromotionEligibilityDto })
  @IsOptional()
  eligibility?: PromotionEligibilityDto;

  @ApiProperty({ type: PromotionEarnRulesDto })
  @IsOptional()
  earn_rules?: PromotionEarnRulesDto;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  approvals?: any[];
}

/**
 * Manual Adjustment DTOs
 */
export class CreateAdjustmentDto {
  @ApiProperty()
  @IsString()
  client_user_id: string;

  @ApiProperty()
  @IsUUID()
  rrr_member_id: string;

  @ApiProperty()
  @IsNumber()
  points: number;

  @ApiProperty()
  @IsString()
  reason_code: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ticket_reference?: string;

  @ApiProperty()
  @IsOptional()
  metadata?: Record<string, any>;
}
