/**
 * Menu Service Tests
 * 
 * Tests for menu CRUD operations and hierarchical menu building.
 * Ensures menu service remains free of financial, auth, or wallet logic.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MenuService } from './menu.service';
import { Menu } from '../schemas';
import { MenuCreatePayload, MenuUpdatePayload, MenuSearchRequestPayload } from '../payloads';
import { NotFoundException } from '@nestjs/common';

describe('MenuService', () => {
  let service: MenuService;
  let mockMenuModel: any;

  beforeEach(async () => {
    // Mock Menu Model
    mockMenuModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getModelToken(Menu.name),
          useValue: mockMenuModel
        }
      ]
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a menu successfully', async () => {
      const payload: MenuCreatePayload = {
        title: 'Test Menu',
        path: '/test',
        section: 'footer',
        internal: true,
        isOpenNewTab: false,
        ordering: 1
      };

      const mockMenu = {
        _id: 'mock-id',
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({ _id: 'mock-id', ...payload })
      };

      mockMenuModel.countDocuments.mockResolvedValue(0);
      mockMenuModel.create.mockResolvedValue(mockMenu);

      const result = await service.create(payload);

      expect(result).toBeDefined();
      expect(result.title).toBe(payload.title);
      expect(mockMenuModel.create).toHaveBeenCalled();
    });

    it('should auto-increment ordering if conflict exists', async () => {
      const payload: MenuCreatePayload = {
        title: 'Test Menu',
        path: '/test',
        section: 'footer',
        internal: true,
        isOpenNewTab: false,
        ordering: 1
      };

      mockMenuModel.countDocuments
        .mockResolvedValueOnce(1) // First ordering value exists
        .mockResolvedValueOnce(0); // Second ordering value is free

      const mockMenu = {
        _id: 'mock-id',
        ...payload,
        ordering: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({ _id: 'mock-id', ...payload, ordering: 2 })
      };

      mockMenuModel.create.mockResolvedValue(mockMenu);

      const result = await service.create(payload);

      expect(result.ordering).toBe(2);
    });
  });

  describe('update', () => {
    it('should update a menu successfully', async () => {
      const menuId = 'test-id';
      const payload: MenuUpdatePayload = {
        title: 'Updated Menu',
        path: '/updated',
        section: 'footer',
        internal: true,
        isOpenNewTab: false,
        ordering: 1
      };

      const mockMenu = {
        _id: menuId,
        title: 'Old Menu',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({ _id: menuId, ...payload })
      };

      mockMenuModel.findById.mockResolvedValue(mockMenu);
      mockMenuModel.countDocuments.mockResolvedValue(0);

      const result = await service.update(menuId, payload);

      expect(result.title).toBe(payload.title);
      expect(mockMenu.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when menu does not exist', async () => {
      const menuId = 'non-existent-id';
      const payload: MenuUpdatePayload = {
        title: 'Updated Menu',
        path: '/updated',
        section: 'footer',
        internal: true,
        isOpenNewTab: false,
        ordering: 1
      };

      mockMenuModel.findById.mockResolvedValue(null);

      await expect(service.update(menuId, payload)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a menu successfully', async () => {
      const menuId = 'test-id';
      const mockMenu = {
        _id: menuId,
        title: 'Test Menu',
        toObject: () => ({ _id: menuId, title: 'Test Menu' })
      };

      mockMenuModel.findOne.mockResolvedValue(mockMenu);
      mockMenuModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.delete(menuId);

      expect(result).toBe(true);
      expect(mockMenuModel.deleteOne).toHaveBeenCalledWith({ _id: menuId });
    });

    it('should throw NotFoundException when menu does not exist', async () => {
      const menuId = 'non-existent-id';

      mockMenuModel.findOne.mockResolvedValue(null);

      await expect(service.delete(menuId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should search menus with query', async () => {
      const payload: MenuSearchRequestPayload = {
        q: 'test',
        section: 'footer',
        limit: 10,
        offset: 0
      };

      const mockMenus = [
        { _id: 'id1', title: 'Test 1', toObject: () => ({ _id: 'id1', title: 'Test 1' }) },
        { _id: 'id2', title: 'Test 2', toObject: () => ({ _id: 'id2', title: 'Test 2' }) }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockMenus)
      };

      mockMenuModel.find.mockReturnValue(mockQuery);
      mockMenuModel.countDocuments.mockResolvedValue(2);

      const result = await service.search(payload);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getAllActiveMenus - Hierarchical Structure', () => {
    it('should build hierarchical menu tree', async () => {
      const mockMenus = [
        {
          _id: 'parent1',
          title: 'Parent Menu',
          path: '/parent',
          section: 'header',
          parentId: null,
          ordering: 1,
          toObject: () => ({
            _id: 'parent1',
            title: 'Parent Menu',
            path: '/parent',
            section: 'header',
            parentId: null,
            ordering: 1
          })
        },
        {
          _id: 'child1',
          title: 'Child Menu 1',
          path: '/child1',
          section: 'header',
          parentId: 'parent1',
          ordering: 1,
          toObject: () => ({
            _id: 'child1',
            title: 'Child Menu 1',
            path: '/child1',
            section: 'header',
            parentId: 'parent1',
            ordering: 1
          })
        },
        {
          _id: 'child2',
          title: 'Child Menu 2',
          path: '/child2',
          section: 'header',
          parentId: 'parent1',
          ordering: 2,
          toObject: () => ({
            _id: 'child2',
            title: 'Child Menu 2',
            path: '/child2',
            section: 'header',
            parentId: 'parent1',
            ordering: 2
          })
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockMenus)
      };

      mockMenuModel.find.mockReturnValue(mockQuery);

      const result = await service.getAllActiveMenus('header');

      expect(result).toHaveLength(1); // One root menu
      expect(result[0].title).toBe('Parent Menu');
      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].title).toBe('Child Menu 1');
      expect(result[0].children[1].title).toBe('Child Menu 2');
    });

    it('should handle menus without children', async () => {
      const mockMenus = [
        {
          _id: 'menu1',
          title: 'Standalone Menu 1',
          path: '/menu1',
          section: 'footer',
          parentId: null,
          ordering: 1,
          toObject: () => ({
            _id: 'menu1',
            title: 'Standalone Menu 1',
            path: '/menu1',
            section: 'footer',
            parentId: null,
            ordering: 1
          })
        },
        {
          _id: 'menu2',
          title: 'Standalone Menu 2',
          path: '/menu2',
          section: 'footer',
          parentId: null,
          ordering: 2,
          toObject: () => ({
            _id: 'menu2',
            title: 'Standalone Menu 2',
            path: '/menu2',
            section: 'footer',
            parentId: null,
            ordering: 2
          })
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockMenus)
      };

      mockMenuModel.find.mockReturnValue(mockQuery);

      const result = await service.getAllActiveMenus('footer');

      expect(result).toHaveLength(2);
      expect(result[0].children).toBeUndefined();
      expect(result[1].children).toBeUndefined();
    });
  });

  describe('Security - No Financial Logic', () => {
    it('should not contain wallet-related logic', () => {
      const serviceCode = service.constructor.toString();
      
      // Ensure no wallet, credit, ledger, or financial terms in the service
      expect(serviceCode).not.toMatch(/wallet/i);
      expect(serviceCode).not.toMatch(/credit/i);
      expect(serviceCode).not.toMatch(/ledger/i);
      expect(serviceCode).not.toMatch(/payment/i);
      expect(serviceCode).not.toMatch(/transaction/i);
    });

    it('should not contain authentication logic', () => {
      const serviceCode = service.constructor.toString();
      
      // Ensure no authentication logic in menu service
      expect(serviceCode).not.toMatch(/password/i);
      expect(serviceCode).not.toMatch(/jwt/i);
      expect(serviceCode).not.toMatch(/token/i);
      expect(serviceCode).not.toMatch(/auth/i);
    });
  });
});
