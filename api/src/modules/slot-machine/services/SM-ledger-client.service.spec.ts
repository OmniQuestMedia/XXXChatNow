/**
 * SM-Ledger-Client Service Unit Tests
 * 
 * Tests circuit breaker functionality and Ledger API integration.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SMledgerClientService } from './SM-ledger-client.service';

describe('SMledgerClientService', () => {
  let service: SMledgerClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SMledgerClientService]
    }).compile();

    service = module.get<SMledgerClientService>(SMledgerClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Circuit Breaker', () => {
    it('should start in CLOSED state', () => {
      const status = service.getCircuitStatus();
      expect(status.state).toBe('closed');
      expect(status.consecutiveFailures).toBe(0);
    });

    it('should allow new games when circuit is CLOSED', () => {
      expect(service.canStartNewGames()).toBe(true);
    });

    it('should report healthy status initially', async () => {
      const health = await service.checkHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.circuitState).toBe('closed');
    });
  });

  describe('Debit Operations', () => {
    it('should process debit with valid request', async () => {
      const request = {
        userId: '507f1f77bcf86cd799439011',
        amount: 100,
        reason: 'slot_machine_spin',
        transactionId: 'txn_test_123',
        idempotencyKey: 'idempotency_test_123'
      };

      const response = await service.debit(request);
      expect(response.success).toBe(true);
      expect(response.newBalance).toBeDefined();
      expect(response.transactionId).toBe(request.transactionId);
    });

    it('should reject debit when circuit is OPEN', async () => {
      // TODO: Implement test to open circuit and verify rejection
      // This would require mocking failures to trigger circuit breaker
    });
  });

  describe('Credit Operations', () => {
    it('should process credit with valid request', async () => {
      const request = {
        userId: '507f1f77bcf86cd799439011',
        amount: 150,
        reason: 'slot_machine_win',
        transactionId: 'txn_test_124',
        idempotencyKey: 'idempotency_test_124',
        metadata: {
          spinId: 'spin_test_1',
          symbols: ['cherry', 'cherry', 'cherry'],
          multiplier: 1.5
        }
      };

      const response = await service.credit(request);
      expect(response.success).toBe(true);
      expect(response.newBalance).toBeDefined();
      expect(response.transactionId).toBe(request.transactionId);
    });
  });

  describe('Balance Operations', () => {
    it('should retrieve user balance', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const balance = await service.getBalance(userId);
      expect(typeof balance).toBe('number');
      expect(balance).toBeGreaterThanOrEqual(0);
    });
  });
});
