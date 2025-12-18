import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBundlesService } from './token-bundles.service';
import { TokenBundle, UserTier } from './entities/token-bundle.entity';
import { NotFoundException } from '@nestjs/common';

describe('TokenBundlesService', () => {
  let service: TokenBundlesService;
  let repository: Repository<TokenBundle>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBundlesService,
        {
          provide: getRepositoryToken(TokenBundle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TokenBundlesService>(TokenBundlesService);
    repository = module.get<Repository<TokenBundle>>(getRepositoryToken(TokenBundle));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a token bundle', async () => {
      const createDto = {
        tier: UserTier.VIP,
        tokens: 100,
        priceUsd: 999,
        sortOrder: 1,
        active: true,
      };

      const expectedBundle = { id: 'uuid', ...createDto };

      mockRepository.create.mockReturnValue(expectedBundle);
      mockRepository.save.mockResolvedValue(expectedBundle);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(expectedBundle);
      expect(result).toEqual(expectedBundle);
    });
  });

  describe('findAll', () => {
    it('should return all bundles ordered by tier and sort order', async () => {
      const bundles = [
        { id: '1', tier: UserTier.VIP, tokens: 100, priceUsd: 999, sortOrder: 1 },
        { id: '2', tier: UserTier.VIP, tokens: 250, priceUsd: 2299, sortOrder: 2 },
      ];

      mockRepository.find.mockResolvedValue(bundles);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { tier: 'ASC', sortOrder: 'ASC' },
      });
      expect(result).toEqual(bundles);
    });
  });

  describe('findByTier', () => {
    it('should return active bundles for a specific tier', async () => {
      const bundles = [
        { id: '1', tier: UserTier.VIP, tokens: 100, priceUsd: 999, active: true },
        { id: '2', tier: UserTier.VIP, tokens: 250, priceUsd: 2299, active: true },
      ];

      mockRepository.find.mockResolvedValue(bundles);

      const result = await service.findByTier(UserTier.VIP);

      expect(repository.find).toHaveBeenCalledWith({
        where: { tier: UserTier.VIP, active: true },
        order: { sortOrder: 'ASC' },
      });
      expect(result).toEqual(bundles);
    });
  });

  describe('findOne', () => {
    it('should return a bundle by ID', async () => {
      const bundle = {
        id: '1',
        tier: UserTier.VIP,
        tokens: 100,
        priceUsd: 999,
      };

      mockRepository.findOne.mockResolvedValue(bundle);

      const result = await service.findOne('1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(bundle);
    });

    it('should throw NotFoundException if bundle not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a bundle', async () => {
      const existingBundle = {
        id: '1',
        tier: UserTier.VIP,
        tokens: 100,
        priceUsd: 999,
      };

      const updateDto = {
        priceUsd: 899,
        active: true,
      };

      const updatedBundle = { ...existingBundle, ...updateDto };

      mockRepository.findOne.mockResolvedValue(existingBundle);
      mockRepository.save.mockResolvedValue(updatedBundle);

      const result = await service.update('1', updateDto);

      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result).toEqual(updatedBundle);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a bundle', async () => {
      const bundle = {
        id: '1',
        tier: UserTier.VIP,
        tokens: 100,
        priceUsd: 999,
        active: true,
      };

      const deactivatedBundle = { ...bundle, active: false };

      mockRepository.findOne.mockResolvedValue(bundle);
      mockRepository.save.mockResolvedValue(deactivatedBundle);

      const result = await service.deactivate('1');

      expect(result.active).toBe(false);
    });
  });

  describe('getMenuForTier', () => {
    it('should return menu with calculations', async () => {
      const bundles = [
        {
          id: '1',
          tier: UserTier.VIP,
          tokens: 100,
          priceUsd: 1000,
          get costPerToken() {
            return this.priceUsd / this.tokens;
          },
        },
        {
          id: '2',
          tier: UserTier.VIP,
          tokens: 250,
          priceUsd: 2000,
          get costPerToken() {
            return this.priceUsd / this.tokens;
          },
        },
      ];

      mockRepository.find.mockResolvedValue(bundles);

      const result = await service.getMenuForTier(UserTier.VIP);

      expect(result.tier).toBe(UserTier.VIP);
      expect(result.bundles).toEqual(bundles);
      expect(result.calculations.highestCostPerToken).toBe(10); // 1000/100
      expect(result.calculations.lowestCostPerToken).toBe(8); // 2000/250
      expect(result.calculations.blendedAverage).toBe(9); // (10 + 8) / 2
      expect(result.footerStatement).toContain('Models are credited a minimum');
    });

    it('should handle empty bundles', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getMenuForTier(UserTier.VIP);

      expect(result.bundles).toEqual([]);
      expect(result.calculations.highestCostPerToken).toBe(0);
      expect(result.calculations.lowestCostPerToken).toBe(0);
      expect(result.calculations.blendedAverage).toBe(0);
    });
  });

  describe('getAllMenus', () => {
    it('should return menus for all tiers', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllMenus();

      expect(result).toHaveLength(5); // 5 tiers
      expect(result[0].tier).toBeDefined();
      expect(result[0].calculations).toBeDefined();
      expect(result[0].footerStatement).toBeDefined();
    });
  });

  describe('seedDefaultBundles', () => {
    it('should seed bundles if none exist', async () => {
      mockRepository.count.mockResolvedValue(0);
      mockRepository.create.mockImplementation((dto) => dto);
      mockRepository.save.mockImplementation((bundle) => Promise.resolve(bundle));

      await service.seedDefaultBundles();

      expect(repository.count).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalled();
    });

    it('should not seed if bundles already exist', async () => {
      mockRepository.count.mockResolvedValue(10);

      await service.seedDefaultBundles();

      expect(repository.count).toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
