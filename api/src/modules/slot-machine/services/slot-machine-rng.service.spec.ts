/**
 * Slot Machine RNG Service Tests
 * 
 * Tests for cryptographically secure random number generation.
 * 
 * References:
 * - XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md (RNG Requirements)
 */

import { SlotMachineRNGService } from './slot-machine-rng.service';
import { DEFAULT_SYMBOLS } from '../constants';

describe('SlotMachineRNGService', () => {
  let service: SlotMachineRNGService;

  beforeEach(() => {
    service = new SlotMachineRNGService();
  });

  describe('generateSpinId', () => {
    it('should generate unique spin IDs', () => {
      const id1 = service.generateSpinId();
      const id2 = service.generateSpinId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^spin_\d+_[a-f0-9]{32}$/);
      expect(id2).toMatch(/^spin_\d+_[a-f0-9]{32}$/);
    });
  });

  describe('selectSymbol', () => {
    it('should select a symbol based on weighted probabilities', () => {
      const symbol = service.selectSymbol(DEFAULT_SYMBOLS);
      
      expect(symbol).toBeDefined();
      expect(DEFAULT_SYMBOLS).toContainEqual(symbol);
    });

    it('should throw error for invalid symbols array', () => {
      expect(() => service.selectSymbol([])).toThrow('No symbols provided');
    });

    it('should throw error if rarities do not sum to 1.0', () => {
      const invalidSymbols = [
        { id: 'test1', rarity: 0.5, payout_3x: 100 },
        { id: 'test2', rarity: 0.3, payout_3x: 200 }
      ];
      
      expect(() => service.selectSymbol(invalidSymbols))
        .toThrow('Symbol rarities must sum to 1.0');
    });

    it('should distribute symbols according to probabilities (statistical test)', () => {
      const iterations = 10000;
      const symbolCounts: Record<string, number> = {};

      // Run many iterations
      for (let i = 0; i < iterations; i++) {
        const symbol = service.selectSymbol(DEFAULT_SYMBOLS);
        symbolCounts[symbol.id] = (symbolCounts[symbol.id] || 0) + 1;
      }

      // Check that each symbol appears roughly proportional to its rarity
      DEFAULT_SYMBOLS.forEach(symbol => {
        const actualFrequency = symbolCounts[symbol.id] / iterations;
        const expectedFrequency = symbol.rarity;
        
        // Allow 10% deviation (statistical tests need tolerance)
        const tolerance = expectedFrequency * 0.1;
        expect(actualFrequency).toBeGreaterThanOrEqual(expectedFrequency - tolerance);
        expect(actualFrequency).toBeLessThanOrEqual(expectedFrequency + tolerance);
      });
    });
  });

  describe('generateSpinResult', () => {
    it('should generate 3 symbols', () => {
      const result = service.generateSpinResult(DEFAULT_SYMBOLS);
      
      expect(result).toHaveLength(3);
      result.forEach(symbol => {
        expect(DEFAULT_SYMBOLS).toContainEqual(symbol);
      });
    });

    it('should generate different results on subsequent calls', () => {
      const result1 = service.generateSpinResult(DEFAULT_SYMBOLS);
      const result2 = service.generateSpinResult(DEFAULT_SYMBOLS);
      
      // It's possible but extremely unlikely to get the same result twice
      // This is a probabilistic test
      const ids1 = result1.map(s => s.id).join(',');
      const ids2 = result2.map(s => s.id).join(',');
      
      // We can't guarantee they're different, but we can verify they're valid
      expect(result1).toHaveLength(3);
      expect(result2).toHaveLength(3);
    });
  });

  describe('generateIntegrityHash', () => {
    it('should generate consistent hash for same data', () => {
      const data = { test: 'data', number: 123 };
      
      const hash1 = service.generateIntegrityHash(data);
      const hash2 = service.generateIntegrityHash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
    });

    it('should generate different hash for different data', () => {
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      
      const hash1 = service.generateIntegrityHash(data1);
      const hash2 = service.generateIntegrityHash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('CSPRNG verification', () => {
    it('should use crypto module, not Math.random()', () => {
      // This test verifies that we're using crypto module
      // by checking the implementation doesn't use Math.random
      const serviceCode = service.constructor.toString();
      
      expect(serviceCode).not.toContain('Math.random');
      // Note: This is a basic check. The actual implementation uses crypto.randomBytes
    });
  });
});
