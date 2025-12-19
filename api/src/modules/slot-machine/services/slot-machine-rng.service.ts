/**
 * Slot Machine Random Number Generator Service
 * 
 * CRITICAL SECURITY REQUIREMENT:
 * Uses cryptographically secure random number generation (CSPRNG).
 * NEVER use Math.random() for slot machine outcomes.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (RNG Requirements section)
 * - SECURITY_AUDIT_POLICY_AND_CHECKLIST.md (No Math.random for financial operations)
 */

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SlotMachineRNGService {
  /**
   * Generate cryptographically secure random number between 0 and 1
   * Uses Node.js crypto module for CSPRNG
   */
  private generateSecureRandom(): number {
    const buffer = crypto.randomBytes(4);
    const randomInt = buffer.readUInt32BE(0);
    const maxInt = 0xffffffff;
    return randomInt / maxInt;
  }

  /**
   * Select a symbol based on weighted probabilities using CSPRNG
   * 
   * @param symbols - Array of symbols with rarity weights
   * @returns Selected symbol
   */
  public selectSymbol(
    symbols: Array<{ id: string; rarity: number; payout_3x: number }>
  ): { id: string; rarity: number; payout_3x: number } {
    if (!symbols || symbols.length === 0) {
      throw new Error('No symbols provided for selection');
    }

    // Validate that rarities sum to approximately 1.0
    const totalRarity = symbols.reduce((sum, s) => sum + s.rarity, 0);
    if (Math.abs(totalRarity - 1.0) > 0.01) {
      throw new Error(`Symbol rarities must sum to 1.0, got ${totalRarity}`);
    }

    const random = this.generateSecureRandom();
    let cumulativeProbability = 0;

    for (const symbol of symbols) {
      cumulativeProbability += symbol.rarity;
      if (random <= cumulativeProbability) {
        return symbol;
      }
    }

    // Fallback to last symbol (should rarely happen due to floating point precision)
    return symbols[symbols.length - 1];
  }

  /**
   * Generate a spin result with 3 symbols
   * Each reel is independent with CSPRNG
   * 
   * @param symbols - Available symbols with weights
   * @returns Array of 3 selected symbols
   */
  public generateSpinResult(
    symbols: Array<{ id: string; rarity: number; payout_3x: number }>
  ): Array<{ id: string; rarity: number; payout_3x: number }> {
    return [
      this.selectSymbol(symbols),
      this.selectSymbol(symbols),
      this.selectSymbol(symbols)
    ];
  }

  /**
   * Generate a unique, cryptographically secure spin ID
   * Format: timestamp + random hex for uniqueness and auditability
   * 
   * @returns Unique spin ID
   */
  public generateSpinId(): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `spin_${timestamp}_${randomBytes}`;
  }

  /**
   * Generate cryptographically secure integrity hash for transaction
   * Used for tamper detection and audit trail
   * 
   * @param data - Transaction data to hash
   * @returns SHA-256 hash
   */
  public generateIntegrityHash(data: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }
}
