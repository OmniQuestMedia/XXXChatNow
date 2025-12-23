/**
 * RedRoomRewards Integration Constants
 * Based on RRR API Contract v1
 */

// RRR API Base Configuration
export const RRR_API_BASE_URL = process.env.RRR_API_BASE_URL || 'https://api.redroomrewards.com';
export const RRR_API_VERSION = 'v1';
export const RRR_CLIENT_ID = process.env.RRR_CLIENT_ID || '';
export const RRR_CLIENT_SECRET = process.env.RRR_CLIENT_SECRET || '';
export const RRR_WEBHOOK_SECRET = process.env.RRR_WEBHOOK_SECRET || '';

// Link Types
export enum RRRLinkType {
  MEMBER = 'MEMBER',
  MODEL = 'MODEL'
}

// Actor Types
export enum RRRActorType {
  MEMBER = 'MEMBER',
  MODEL = 'MODEL',
  CLIENT_ADMIN = 'CLIENT_ADMIN',
  RRR_ADMIN = 'RRR_ADMIN',
  SERVICE = 'SERVICE'
}

// Ledger Entry Types
export enum RRRLedgerEntryType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  REVERSAL = 'REVERSAL'
}

// Event Types for Earning
export enum RRREarnEventType {
  TOKEN_PURCHASE = 'TOKEN_PURCHASE',
  MEMBERSHIP_PURCHASE = 'MEMBERSHIP_PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  MODEL_AWARD = 'MODEL_AWARD'
}

// Posting Modes
export enum RRRPostingMode {
  POSTED = 'POSTED',
  PENDING = 'PENDING'
}

// Redemption Modes
export enum RRRRedemptionMode {
  MAX = 'MAX',
  EXACT = 'EXACT'
}

// Reversal Reasons
export enum RRRReversalReason {
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELLED = 'CANCELLED',
  FRAUD_BLOCKED = 'FRAUD_BLOCKED'
}

// Link Status
export enum RRRLinkStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

// Webhook Event Types
export enum RRRWebhookEventType {
  POINTS_POSTED = 'POINTS_POSTED',
  POINTS_REVERSED = 'POINTS_REVERSED',
  REDEMPTION_COMMITTED = 'REDEMPTION_COMMITTED',
  REDEMPTION_REVERSED = 'REDEMPTION_REVERSED',
  LINK_UPDATED = 'LINK_UPDATED',
  PROMOTION_STATUS_CHANGED = 'PROMOTION_STATUS_CHANGED',
  TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',
  TRANSFER_REVERSED = 'TRANSFER_REVERSED'
}

// Promotion Status
export enum RRRPromotionStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED'
}

// Proof Methods
export enum RRRProofMethod {
  SSO_ASSERTION = 'SSO_ASSERTION',
  EMAIL_OTP = 'EMAIL_OTP',
  SIGNED_JWT = 'SIGNED_JWT'
}

// Error Codes
export enum RRRErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  IDEMPOTENCY_KEY_REUSE_MISMATCH = 'IDEMPOTENCY_KEY_REUSE_MISMATCH'
}

// Business Timezone
export const RRR_BUSINESS_TIMEZONE = 'America/Toronto';

// Rate Limiting
export const RRR_RATE_LIMIT_RPS = 100;
export const RRR_RATE_LIMIT_BURST = 200;

// SLA Constants
export const RRR_POSTING_SLA_HOURS = 48;
export const RRR_HOT_QUERY_DAYS = 120;
export const RRR_ARCHIVE_RETENTION_YEARS = 7;
export const RRR_IDEMPOTENCY_KEY_RETENTION_DAYS = 30;
