/**
 * Slot Machine Transaction DTO
 * 
 * Data Transfer Objects for slot machine transactions.
 * Only includes non-sensitive data suitable for client responses.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (API Specification section)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (No PII in responses)
 */

import { ObjectId } from 'mongodb';
import pick from 'lodash/pick';

export class SlotMachineTransactionDto {
  _id: ObjectId;

  spinId: string;

  userId: ObjectId;

  betAmount: number;

  resultSymbols: string[];

  isWin: boolean;

  payout: number;

  multiplier: number;

  balanceBefore: number;

  balanceAfter: number;

  status: string;

  serverTimestamp: Date;

  createdAt: Date;

  constructor(data: any) {
    // Only include safe fields, never expose PII or sensitive data
    Object.assign(
      this,
      pick(data, [
        '_id',
        'spinId',
        'userId',
        'betAmount',
        'resultSymbols',
        'isWin',
        'payout',
        'multiplier',
        'balanceBefore',
        'balanceAfter',
        'status',
        'serverTimestamp',
        'createdAt'
      ])
    );
  }
}

export class SlotMachineSpinResultDto {
  spinId: string;

  timestamp: Date;

  betAmount: number;

  result: {
    symbols: string[];
    isWin: boolean;
    payout: number;
    multiplier: number;
  };

  newBalance: number;

  previousBalance: number;

  constructor(transaction: any) {
    this.spinId = transaction.spinId;
    this.timestamp = transaction.serverTimestamp || transaction.createdAt;
    this.betAmount = transaction.betAmount;
    this.result = {
      symbols: transaction.resultSymbols,
      isWin: transaction.isWin,
      payout: transaction.payout,
      multiplier: transaction.multiplier
    };
    this.newBalance = transaction.balanceAfter;
    this.previousBalance = transaction.balanceBefore;
  }
}

export class SlotMachineHistoryItemDto {
  spinId: string;

  timestamp: Date;

  betAmount: number;

  symbols: string[];

  payout: number;

  isWin: boolean;

  constructor(transaction: any) {
    this.spinId = transaction.spinId;
    this.timestamp = transaction.serverTimestamp || transaction.createdAt;
    this.betAmount = transaction.betAmount;
    this.symbols = transaction.resultSymbols;
    this.payout = transaction.payout;
    this.isWin = transaction.isWin;
  }
}
