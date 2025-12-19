/**
 * Slot Machine Module Constants
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

export const SLOT_MACHINE_CHANNEL = 'SLOT_MACHINE_CHANNEL';

export const SLOT_MACHINE_EVENT = {
  SPIN_CREATED: 'spin.created',
  SPIN_COMPLETED: 'spin.completed',
  SPIN_FAILED: 'spin.failed',
  CONFIG_UPDATED: 'config.updated'
};

export const SPIN_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const TRANSACTION_TYPE = {
  DEBIT: 'debit',
  CREDIT: 'credit'
};

// Rate limiting: 100 spins per hour per user (as per briefing)
export const MAX_SPINS_PER_HOUR = 100;

// Default spin cost in loyalty points (as per briefing)
export const DEFAULT_SPIN_COST = 100;

// Default Return to Player percentage (as per briefing)
export const DEFAULT_RTP = 0.95;

// Symbol configuration from briefing
export const DEFAULT_SYMBOLS = [
  { id: 'cherry', rarity: 0.30, payout_3x: 150 },
  { id: 'lemon', rarity: 0.25, payout_3x: 200 },
  { id: 'orange', rarity: 0.20, payout_3x: 300 },
  { id: 'plum', rarity: 0.12, payout_3x: 500 },
  { id: 'bell', rarity: 0.08, payout_3x: 1000 },
  { id: 'star', rarity: 0.03, payout_3x: 2500 },
  { id: 'seven', rarity: 0.015, payout_3x: 5000 },
  { id: 'diamond', rarity: 0.005, payout_3x: 10000 }
];

// Error codes
export const SLOT_MACHINE_ERRORS = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_BET: 'INVALID_BET',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  AGE_VERIFICATION_FAILED: 'AGE_VERIFICATION_FAILED',
  JURISDICTION_BLOCKED: 'JURISDICTION_BLOCKED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND'
};
