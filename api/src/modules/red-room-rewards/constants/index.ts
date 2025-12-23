/**
 * RedRoomRewards Constants
 * 
 * Defines trust levels, transaction types, limits, and configuration
 * as per RedRoomRewards Account Merge, Points Transfer, and Exception Policy v1
 */

// Trust Levels (Section 3.2)
export enum TrustLevel {
  L0 = 'L0', // unverified
  L1 = 'L1', // email verified + linked to at least one client profile
  L2 = 'L2', // email + phone verified; no fraud flags
  L3 = 'L3', // enhanced verification (optional; jurisdiction-dependent)
}

// Member Types
export enum MemberType {
  CONSUMER = 'CONSUMER',
  MODEL = 'MODEL',
}

// Transaction Types
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  AWARD_OUT = 'AWARD_OUT',
  AWARD_IN = 'AWARD_IN',
  ADJUST = 'ADJUST',
  MERGE = 'MERGE',
  REVERSAL = 'REVERSAL',
}

// Points Source Types
export enum PointsSourceType {
  PURCHASE = 'PURCHASE', // cash-earned
  PROMO = 'PROMO', // promotional
  GIFT = 'GIFT', // gift
  AWARD = 'AWARD', // model award
  TRANSFER = 'TRANSFER', // transfer from another member
  ADJUSTMENT = 'ADJUSTMENT', // manual adjustment
}

// Lock Types (Section 8)
export enum LockType {
  TRANSFER = 'TRANSFER',
  REDEMPTION = 'REDEMPTION',
  FULL_ACCOUNT = 'FULL_ACCOUNT',
}

// Merge Status
export enum MergeStatus {
  PENDING = 'PENDING',
  APPROVED_STAGE1 = 'APPROVED_STAGE1', // Client admins approved
  APPROVED_STAGE2 = 'APPROVED_STAGE2', // RRR admin approved
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

// Account Status
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  MERGED = 'MERGED', // account has been merged into another
  CLOSED = 'CLOSED',
}

// Link Status
export enum LinkStatus {
  ACTIVE = 'ACTIVE',
  RETIRED = 'RETIRED', // detached during merge
  SUSPENDED = 'SUSPENDED',
}

// Transfer Status
export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ESCROWED = 'ESCROWED', // held by risk rules
  REVERSED = 'REVERSED',
  FAILED = 'FAILED',
}

// Reason Codes for Manual Adjustments
export enum ReasonCode {
  CUSTOMER_SERVICE_CREDIT = 'CUSTOMER_SERVICE_CREDIT',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  PROMOTIONAL_BONUS = 'PROMOTIONAL_BONUS',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
  FRAUDULENT_ACTIVITY = 'FRAUDULENT_ACTIVITY',
  SYSTEM_CORRECTION = 'SYSTEM_CORRECTION',
  CHARGEBACK = 'CHARGEBACK',
  REVERSAL = 'REVERSAL',
  OTHER = 'OTHER',
}

// Evidence Types for Merges (Section 5.3)
export enum EvidenceType {
  EMAIL_OTP = 'EMAIL_OTP', // strong
  PHONE_OTP = 'PHONE_OTP', // strong
  PAYMENT_FINGERPRINT = 'PAYMENT_FINGERPRINT', // strong
  GOVERNMENT_ID = 'GOVERNMENT_ID', // strong
  DEVICE_CLUSTER = 'DEVICE_CLUSTER', // supporting
  REGION_CONSISTENCY = 'REGION_CONSISTENCY', // supporting
  SSO_ASSERTION = 'SSO_ASSERTION', // supporting
}

// Default Transfer Limits (Section 3.4) - baseline; configurable
export const DEFAULT_TRANSFER_LIMITS = {
  DAILY_CAP: 500,
  WEEKLY_CAP: 1500,
  SINGLE_TRANSFER_CAP: 250,
  COOLING_PERIOD_HOURS: 24,
  MINIMUM_ACCOUNT_AGE_DAYS: 14,
  MINIMUM_TRUST_LEVEL: TrustLevel.L2,
};

// Model Award Limits (Section 4.3) - baseline; configurable
export const DEFAULT_AWARD_LIMITS = {
  PER_VIEWER_PER_STREAM: 100,
  PER_MODEL_PER_DAY: 2000,
  PER_MODEL_PER_HOUR: 400,
  MINIMUM_AWARD: 1,
};

// Manual Adjustment Approval Thresholds (Section 6.2)
export const ADJUSTMENT_APPROVAL_THRESHOLDS = {
  SINGLE_ADMIN: 100, // <= 100 points: 1 admin
  DUAL_ADMIN: 500, // 101-500 points: 2 admins
  // > 500 points: 2 client admins + 1 RRR admin
};

// Expiry Defaults (Section 7)
export const DEFAULT_EXPIRY_DAYS = {
  PURCHASE: 365, // cash-earned
  PROMO_MIN: 30, // promotional minimum
  PROMO_MAX: 90, // promotional maximum
  GIFT_MIN: 30,
  GIFT_MAX: 90,
};

// Retention Periods (Section 9)
export const RETENTION_PERIODS = {
  HOT_DATA_DAYS: 120,
  ARCHIVE_YEARS: 7,
};

// Client Identifiers
export const CLIENT_XCN = 'XCN';
