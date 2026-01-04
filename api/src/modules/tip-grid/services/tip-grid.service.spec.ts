import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TipGridService } from './tip-grid.service';
import { TipMenu, TipMenuItem } from '../schemas';
import { PurchasedItem } from 'src/modules/purchased-item/schemas/purchase-item.schema';
import { QueueEventService } from 'src/kernel';
import { PerformerService } from 'src/modules/performer/services';
import { PerformanceQueueService } from 'src/modules/performance-queue/services';
import {
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TYPE,
  PURCHASED_ITEM_SUCCESS_CHANNEL
} from 'src/modules/purchased-item/constants';

describe('TipGridService - PHASE 7 QUEUED Mode', () => {
  let service: TipGridService;
  let tipMenuItemModel: Model<TipMenuItem>;
  let purchasedItemModel: Model<PurchasedItem>;
  let performerService: PerformerService;
  let performanceQueueService: PerformanceQueueService;
  let queueEventService: QueueEventService;

  const mockUserId = new Types.ObjectId();
  const mockPerformerId = new Types.ObjectId();
  const mockTipMenuId = new Types.ObjectId();
  const mockTipMenuItemId = new Types.ObjectId();
  const mockPurchasedItemId = new Types.ObjectId();

  const mockTipMenuItem = {
    _id: mockTipMenuItemId,
    tipMenuId: mockTipMenuId,
    performerId: mockPerformerId,
    label: 'Test Tip',
    description: 'Test tip description',
    price: 100,
    position: 1,
    isActive: true
  };

  const mockPerformer = {
    _id: mockPerformerId,
    username: 'testperformer'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipGridService,
        {
          provide: getModelToken(TipMenu.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: getModelToken(TipMenuItem.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn()
          }
        },
        {
          provide: getModelToken(PurchasedItem.name),
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            updateOne: jest.fn()
          }
        },
        {
          provide: QueueEventService,
          useValue: {
            publish: jest.fn().mockResolvedValue(true),
            subscribe: jest.fn()
          }
        },
        {
          provide: PerformerService,
          useValue: {
            findById: jest.fn()
          }
        },
        {
          provide: PerformanceQueueService,
          useValue: {
            submitRequest: jest.fn(),
            registerProcessor: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<TipGridService>(TipGridService);
    tipMenuItemModel = module.get<Model<TipMenuItem>>(getModelToken(TipMenuItem.name));
    purchasedItemModel = module.get<Model<PurchasedItem>>(getModelToken(PurchasedItem.name));
    performerService = module.get<PerformerService>(PerformerService);
    performanceQueueService = module.get<PerformanceQueueService>(PerformanceQueueService);
    queueEventService = module.get<QueueEventService>(QueueEventService);

    // Initialize module
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IMMEDIATE execution mode (existing Phase 2 behavior)', () => {
    it('should purchase tip grid item immediately with status SUCCESS', async () => {
      const mockPurchasedItem = {
        _id: mockPurchasedItemId,
        sourceId: mockUserId,
        sellerId: mockPerformerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        totalPrice: 100
      };

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mockTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(mockPerformer as any);
      jest.spyOn(purchasedItemModel, 'create').mockResolvedValue(mockPurchasedItem as any);

      const result = await service.purchaseTipGridItem(mockUserId, {
        tipMenuItemId: mockTipMenuItemId.toString(),
        performerId: mockPerformerId.toString(),
        executionMode: 'IMMEDIATE'
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(mockPurchasedItemId);
      expect(purchasedItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PURCHASE_ITEM_STATUS.SUCCESS,
          type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM
        })
      );
      expect(queueEventService.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL
        })
      );
      expect(performanceQueueService.submitRequest).not.toHaveBeenCalled();
    });

    it('should use IMMEDIATE as default when executionMode is not specified', async () => {
      const mockPurchasedItem = {
        _id: mockPurchasedItemId,
        sourceId: mockUserId,
        sellerId: mockPerformerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        status: PURCHASE_ITEM_STATUS.SUCCESS,
        totalPrice: 100
      };

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mockTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(mockPerformer as any);
      jest.spyOn(purchasedItemModel, 'create').mockResolvedValue(mockPurchasedItem as any);

      const result = await service.purchaseTipGridItem(mockUserId, {
        tipMenuItemId: mockTipMenuItemId.toString(),
        performerId: mockPerformerId.toString()
        // executionMode not specified - should default to IMMEDIATE
      });

      expect(result.success).toBe(true);
      expect(queueEventService.publish).toHaveBeenCalled();
      expect(performanceQueueService.submitRequest).not.toHaveBeenCalled();
    });
  });

  describe('QUEUED execution mode (new Phase 7 behavior)', () => {
    it('should create PurchasedItem with status PENDING for QUEUED mode', async () => {
      const mockPurchasedItem = {
        _id: mockPurchasedItemId,
        sourceId: mockUserId,
        sellerId: mockPerformerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        status: PURCHASE_ITEM_STATUS.PENDING,
        totalPrice: 100
      };

      const mockQueueResponse = {
        requestId: 'queue-request-123',
        status: 'pending',
        mode: 'fifo',
        type: 'tip_grid_item_queued',
        priority: 5,
        createdAt: new Date(),
        queuePosition: 5
      };

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mockTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(mockPerformer as any);
      jest.spyOn(purchasedItemModel, 'create').mockResolvedValue(mockPurchasedItem as any);
      jest.spyOn(performanceQueueService, 'submitRequest').mockResolvedValue(mockQueueResponse as any);

      const result = await service.purchaseTipGridItem(mockUserId, {
        tipMenuItemId: mockTipMenuItemId.toString(),
        performerId: mockPerformerId.toString(),
        executionMode: 'QUEUED'
      });

      expect(result.success).toBe(true);
      expect(result.queueRequestId).toBe('queue-request-123');
      expect(result.purchasedItemId).toBe(mockPurchasedItemId);
      expect(result.queuePosition).toBe(5);

      // Verify PurchasedItem created with PENDING status
      expect(purchasedItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PURCHASE_ITEM_STATUS.PENDING,
          type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
          extraInfo: expect.objectContaining({
            executionMode: 'QUEUED'
          })
        })
      );

      // Verify NOT published to settlement channel immediately
      expect(queueEventService.publish).not.toHaveBeenCalled();

      // Verify enqueued to PerformanceQueue
      expect(performanceQueueService.submitRequest).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          type: 'tip_grid_item_queued',
          mode: 'fifo',
          payload: expect.objectContaining({
            purchasedItemId: mockPurchasedItemId.toString(),
            performerId: mockPerformerId.toString(),
            userId: mockUserId.toString()
          })
        })
      );
    });

    it('should use idempotencyKey when provided in QUEUED mode', async () => {
      const idempotencyKey = 'unique-key-456';
      const mockPurchasedItem = {
        _id: mockPurchasedItemId,
        sourceId: mockUserId,
        sellerId: mockPerformerId,
        status: PURCHASE_ITEM_STATUS.PENDING,
        idempotencyKey
      };

      const mockQueueResponse = {
        requestId: 'queue-request-123',
        status: 'pending'
      };

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mockTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(mockPerformer as any);
      jest.spyOn(purchasedItemModel, 'create').mockResolvedValue(mockPurchasedItem as any);
      jest.spyOn(performanceQueueService, 'submitRequest').mockResolvedValue(mockQueueResponse as any);

      await service.purchaseTipGridItem(mockUserId, {
        tipMenuItemId: mockTipMenuItemId.toString(),
        performerId: mockPerformerId.toString(),
        executionMode: 'QUEUED',
        idempotencyKey
      });

      // Verify idempotencyKey used in PurchasedItem
      expect(purchasedItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey
        })
      );

      // Verify idempotencyKey used in queue submission
      expect(performanceQueueService.submitRequest).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          idempotencyKey,
          payload: expect.objectContaining({
            idempotencyKey
          })
        })
      );
    });

    it('should handle duplicate idempotency key in QUEUED mode', async () => {
      const idempotencyKey = 'duplicate-key';

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mockTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(mockPerformer as any);
      jest.spyOn(purchasedItemModel, 'create').mockRejectedValue({
        code: 11000,
        keyPattern: { idempotencyKey: 1 }
      });

      await expect(
        service.purchaseTipGridItem(mockUserId, {
          tipMenuItemId: mockTipMenuItemId.toString(),
          performerId: mockPerformerId.toString(),
          executionMode: 'QUEUED',
          idempotencyKey
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Queue processor completion hook', () => {
    it('should update status to SUCCESS and publish to settlement channel when job completes', async () => {
      const mockPendingItem = {
        _id: mockPurchasedItemId,
        sourceId: mockUserId,
        sellerId: mockPerformerId,
        type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
        status: PURCHASE_ITEM_STATUS.PENDING,
        totalPrice: 100
      };

      const mockUpdatedItem = {
        ...mockPendingItem,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      };

      jest.spyOn(purchasedItemModel, 'findById')
        .mockResolvedValueOnce(mockPendingItem as any)
        .mockResolvedValueOnce(mockUpdatedItem as any);
      jest.spyOn(purchasedItemModel, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);

      // Get the registered processor
      const registerProcessorCall = (performanceQueueService.registerProcessor as jest.Mock).mock.calls[0];
      const processorFunction = registerProcessorCall[1];

      // Execute the processor
      const result = await processorFunction({
        purchasedItemId: mockPurchasedItemId.toString(),
        performerId: mockPerformerId.toString(),
        userId: mockUserId.toString()
      });

      expect(result.success).toBe(true);

      // Verify status updated to SUCCESS
      expect(purchasedItemModel.updateOne).toHaveBeenCalledWith(
        { _id: mockPurchasedItemId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: PURCHASE_ITEM_STATUS.SUCCESS
          })
        })
      );

      // Verify NOW published to settlement channel
      expect(queueEventService.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          data: mockUpdatedItem
        })
      );
    });

    it('should handle already-processed items idempotently', async () => {
      const mockSuccessItem = {
        _id: mockPurchasedItemId,
        status: PURCHASE_ITEM_STATUS.SUCCESS
      };

      jest.spyOn(purchasedItemModel, 'findById').mockResolvedValue(mockSuccessItem as any);

      const registerProcessorCall = (performanceQueueService.registerProcessor as jest.Mock).mock.calls[0];
      const processorFunction = registerProcessorCall[1];

      const result = await processorFunction({
        purchasedItemId: mockPurchasedItemId.toString()
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Already processed');

      // Should NOT update or publish again
      expect(purchasedItemModel.updateOne).not.toHaveBeenCalled();
      expect(queueEventService.publish).not.toHaveBeenCalled();
    });

    it('should throw error if PurchasedItem not found during processing', async () => {
      jest.spyOn(purchasedItemModel, 'findById').mockResolvedValue(null);

      const registerProcessorCall = (performanceQueueService.registerProcessor as jest.Mock).mock.calls[0];
      const processorFunction = registerProcessorCall[1];

      await expect(
        processorFunction({
          purchasedItemId: 'non-existent-id'
        })
      ).rejects.toThrow('PurchasedItem not found');
    });
  });

  describe('Validation', () => {
    it('should throw error if tip menu item is not active', async () => {
      const inactiveTipMenuItem = { ...mockTipMenuItem, isActive: false };

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(inactiveTipMenuItem as any);

      await expect(
        service.purchaseTipGridItem(mockUserId, {
          tipMenuItemId: mockTipMenuItemId.toString(),
          performerId: mockPerformerId.toString(),
          executionMode: 'QUEUED'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if performer not found', async () => {
      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mockTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(null);

      await expect(
        service.purchaseTipGridItem(mockUserId, {
          tipMenuItemId: mockTipMenuItemId.toString(),
          performerId: mockPerformerId.toString(),
          executionMode: 'QUEUED'
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if tip menu item does not belong to performer', async () => {
      const differentPerformerId = new Types.ObjectId();
      const mismatchedTipMenuItem = { ...mockTipMenuItem, performerId: differentPerformerId };

      jest.spyOn(tipMenuItemModel, 'findById').mockResolvedValue(mismatchedTipMenuItem as any);
      jest.spyOn(performerService, 'findById').mockResolvedValue(mockPerformer as any);

      await expect(
        service.purchaseTipGridItem(mockUserId, {
          tipMenuItemId: mockTipMenuItemId.toString(),
          performerId: mockPerformerId.toString(),
          executionMode: 'QUEUED'
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
