import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletService } from './wallet.service';
import { TokenLot, TokenLotType } from './entities/token-lot.entity';
import { TokenTransaction } from './entities/token-transaction.entity';
import { PolicyService } from '../policy/policy.service';
import { BadRequestException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let lotRepository: Repository<TokenLot>;
  let transactionRepository: Repository<TokenTransaction>;
  let policyService: PolicyService;

  const mockLotRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPolicyService = {
    getValue: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(TokenLot),
          useValue: mockLotRepository,
        },
        {
          provide: getRepositoryToken(TokenTransaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    lotRepository = module.get<Repository<TokenLot>>(getRepositoryToken(TokenLot));
    transactionRepository = module.get<Repository<TokenTransaction>>(
      getRepositoryToken(TokenTransaction),
    );
    policyService = module.get<PolicyService>(PolicyService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('awardTokens', () => {
    it('should create a new token lot', async () => {
      const awardDto = {
        userId: 'user-1',
        lotType: TokenLotType.PROMO_BONUS,
        tokens: 100,
        sourceId: 'campaign-1',
        expiresAt: new Date('2026-06-30T23:59:59Z'),
        graceHours: 24,
      };

      const expectedLot = {
        id: 'lot-1',
        ...awardDto,
        originalTokens: 100,
      };

      mockLotRepository.create.mockReturnValue(expectedLot);
      mockLotRepository.save.mockResolvedValue(expectedLot);

      const result = await service.awardTokens(awardDto);

      expect(lotRepository.create).toHaveBeenCalled();
      expect(lotRepository.save).toHaveBeenCalled();
      expect(result.tokens).toBe(100);
      expect(result.lotType).toBe(TokenLotType.PROMO_BONUS);
    });
  });

  describe('getBalance', () => {
    it('should return balance breakdown by lot type', async () => {
      const lots = [
        {
          id: '1',
          userId: 'user-1',
          lotType: TokenLotType.PROMO_BONUS,
          tokens: 50,
          expired: false,
        },
        {
          id: '2',
          userId: 'user-1',
          lotType: TokenLotType.MEMBERSHIP_MONTHLY,
          tokens: 100,
          expired: false,
        },
        {
          id: '3',
          userId: 'user-1',
          lotType: TokenLotType.PURCHASED,
          tokens: 200,
          expired: false,
        },
      ];

      mockLotRepository.update.mockResolvedValue({ affected: 0 });
      mockLotRepository.find.mockResolvedValue(lots);

      const result = await service.getBalance('user-1');

      expect(result.totalTokens).toBe(350);
      expect(result.breakdown.promoBonus).toBe(50);
      expect(result.breakdown.membershipMonthly).toBe(100);
      expect(result.breakdown.purchased).toBe(200);
      expect(result.activeLots).toBe(3);
    });

    it('should return zero balance when no lots exist', async () => {
      mockLotRepository.update.mockResolvedValue({ affected: 0 });
      mockLotRepository.find.mockResolvedValue([]);

      const result = await service.getBalance('user-1');

      expect(result.totalTokens).toBe(0);
      expect(result.breakdown.promoBonus).toBe(0);
      expect(result.breakdown.membershipMonthly).toBe(0);
      expect(result.breakdown.purchased).toBe(0);
    });
  });

  describe('spendTokens', () => {
    it('should enforce spend order (promo → membership → purchased)', async () => {
      const spendDto = {
        amount: 150,
        purpose: 'tip',
        idempotencyKey: 'key-1',
      };

      const lots = [
        {
          id: '1',
          userId: 'user-1',
          lotType: TokenLotType.PROMO_BONUS,
          tokens: 50,
          expiresAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          lotType: TokenLotType.MEMBERSHIP_MONTHLY,
          tokens: 100,
          expiresAt: new Date(),
        },
        {
          id: '3',
          userId: 'user-1',
          lotType: TokenLotType.PURCHASED,
          tokens: 200,
          expiresAt: new Date(),
        },
      ];

      mockTransactionRepository.findOne.mockResolvedValue(null);
      mockLotRepository.update.mockResolvedValue({ affected: 0 });
      mockLotRepository.find.mockResolvedValue(lots);
      mockPolicyService.getValue.mockResolvedValue([
        'promo_bonus',
        'membership_monthly',
        'purchased',
      ]);

      const expectedTransaction = {
        id: 'tx-1',
        userId: 'user-1',
        amount: 150,
        lotsUsed: [
          { lotId: '1', tokensUsed: 50, lotType: 'promo_bonus' },
          { lotId: '2', tokensUsed: 100, lotType: 'membership_monthly' },
        ],
      };

      mockTransactionRepository.create.mockReturnValue(expectedTransaction);
      mockQueryRunner.manager.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.spendTokens('user-1', spendDto);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.amount).toBe(150);
    });

    it('should throw error if insufficient tokens', async () => {
      const spendDto = {
        amount: 1000,
        purpose: 'tip',
        idempotencyKey: 'key-1',
      };

      const lots = [
        {
          id: '1',
          userId: 'user-1',
          lotType: TokenLotType.PURCHASED,
          tokens: 100,
          expiresAt: new Date(),
        },
      ];

      mockTransactionRepository.findOne.mockResolvedValue(null);
      mockLotRepository.update.mockResolvedValue({ affected: 0 });
      mockLotRepository.find.mockResolvedValue(lots);
      mockPolicyService.getValue.mockResolvedValue(['purchased']);

      await expect(service.spendTokens('user-1', spendDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should be idempotent (return existing transaction)', async () => {
      const spendDto = {
        amount: 100,
        purpose: 'tip',
        idempotencyKey: 'key-1',
      };

      const existingTransaction = {
        id: 'tx-1',
        userId: 'user-1',
        amount: 100,
        idempotencyKey: 'key-1',
      };

      mockTransactionRepository.findOne.mockResolvedValue(existingTransaction);

      const result = await service.spendTokens('user-1', spendDto);

      expect(result).toEqual(existingTransaction);
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });
  });

  describe('expireOldLots', () => {
    it('should expire lots past grace period', async () => {
      mockLotRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.expireOldLots('user-1');

      expect(result).toBe(2);
      expect(lotRepository.update).toHaveBeenCalled();
    });
  });

  describe('getActiveLots', () => {
    it('should return only non-expired lots', async () => {
      const lots = [
        { id: '1', userId: 'user-1', tokens: 50, expired: false },
        { id: '2', userId: 'user-1', tokens: 100, expired: false },
      ];

      mockLotRepository.find.mockResolvedValue(lots);

      const result = await service.getActiveLots('user-1');

      expect(result).toHaveLength(2);
      expect(lotRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', expired: false },
        order: { expiresAt: 'ASC' },
      });
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history', async () => {
      const transactions = [
        { id: 'tx-1', userId: 'user-1', amount: 100 },
        { id: 'tx-2', userId: 'user-1', amount: 50 },
      ];

      mockTransactionRepository.find.mockResolvedValue(transactions);

      const result = await service.getTransactions('user-1');

      expect(result).toHaveLength(2);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  });

  describe('getAuditTrail', () => {
    it('should return complete audit trail', async () => {
      const lots = [{ id: '1', userId: 'user-1', tokens: 100 }];
      const transactions = [{ id: 'tx-1', userId: 'user-1', amount: 50 }];

      mockLotRepository.find.mockResolvedValue(lots);
      mockTransactionRepository.find.mockResolvedValue(transactions);

      const result = await service.getAuditTrail('user-1');

      expect(result.lots).toEqual(lots);
      expect(result.transactions).toEqual(transactions);
    });
  });
});
