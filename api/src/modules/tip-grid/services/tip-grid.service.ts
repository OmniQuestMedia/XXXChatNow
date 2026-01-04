import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { TipMenu, TipMenuItem } from '../schemas';
import {
  CreateTipMenuDto,
  UpdateTipMenuDto,
  CreateTipMenuItemDto,
  UpdateTipMenuItemDto,
  PurchaseTipGridItemDto
} from '../dtos';
import { QueueEventService, QueueEvent } from 'src/kernel';
import { PURCHASED_ITEM_SUCCESS_CHANNEL, PURCHASE_ITEM_TYPE, PURCHASE_ITEM_STATUS, PURCHASE_ITEM_TARGET_TYPE } from 'src/modules/purchased-item/constants';
import { EVENT, ROLE } from 'src/kernel/constants';
import { PurchasedItem } from 'src/modules/purchased-item/schemas/purchase-item.schema';
import { PerformerService } from 'src/modules/performer/services';
import { PerformanceQueueService } from 'src/modules/performance-queue/services';

@Injectable()
export class TipGridService implements OnModuleInit {
  constructor(
    @InjectModel(TipMenu.name) private readonly TipMenuModel: Model<TipMenu>,
    @InjectModel(TipMenuItem.name) private readonly TipMenuItemModel: Model<TipMenuItem>,
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>,
    private readonly queueEventService: QueueEventService,
    private readonly performerService: PerformerService,
    private readonly performanceQueueService: PerformanceQueueService
  ) {}

  async onModuleInit() {
    // Register processor for queued tip grid items
    this.performanceQueueService.registerProcessor(
      'tip_grid_item_queued',
      this.processTipGridItemQueued.bind(this)
    );
  }

  // TipMenu CRUD operations
  async createTipMenu(performerId: string | ObjectId, data: CreateTipMenuDto): Promise<TipMenu> {
    const existing = await this.TipMenuModel.findOne({ performerId });
    if (existing) {
      throw new BadRequestException('Tip menu already exists for this performer');
    }

    const tipMenu = await this.TipMenuModel.create({
      performerId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return tipMenu;
  }

  async getTipMenuByPerformerId(performerId: string | ObjectId): Promise<TipMenu> {
    const tipMenu = await this.TipMenuModel.findOne({ performerId });
    if (!tipMenu) {
      throw new NotFoundException('Tip menu not found');
    }
    return tipMenu;
  }

  async updateTipMenu(performerId: string | ObjectId, data: UpdateTipMenuDto): Promise<TipMenu> {
    const tipMenu = await this.TipMenuModel.findOneAndUpdate(
      { performerId },
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!tipMenu) {
      throw new NotFoundException('Tip menu not found');
    }

    return tipMenu;
  }

  async deleteTipMenu(performerId: string | ObjectId): Promise<void> {
    const result = await this.TipMenuModel.deleteOne({ performerId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Tip menu not found');
    }

    // Also delete all associated items
    await this.TipMenuItemModel.deleteMany({ performerId });
  }

  // TipMenuItem CRUD operations
  async createTipMenuItem(performerId: string | ObjectId, data: CreateTipMenuItemDto): Promise<TipMenuItem> {
    const tipMenu = await this.getTipMenuByPerformerId(performerId);

    const tipMenuItem = await this.TipMenuItemModel.create({
      tipMenuId: (tipMenu as any)._id,
      performerId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return tipMenuItem;
  }

  async getTipMenuItems(performerId: string | ObjectId): Promise<TipMenuItem[]> {
    return this.TipMenuItemModel.find({ performerId, isActive: true }).sort({ position: 1, createdAt: 1 });
  }

  async getTipMenuItemById(itemId: string | ObjectId): Promise<TipMenuItem> {
    const item = await this.TipMenuItemModel.findById(itemId);
    if (!item) {
      throw new NotFoundException('Tip menu item not found');
    }
    return item;
  }

  async updateTipMenuItem(itemId: string | ObjectId, data: UpdateTipMenuItemDto): Promise<TipMenuItem> {
    const item = await this.TipMenuItemModel.findByIdAndUpdate(
      itemId,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!item) {
      throw new NotFoundException('Tip menu item not found');
    }

    return item;
  }

  async deleteTipMenuItem(itemId: string | ObjectId): Promise<void> {
    const result = await this.TipMenuItemModel.deleteOne({ _id: itemId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Tip menu item not found');
    }
  }

  // Purchase TipGridItem
  async purchaseTipGridItem(userId: string | ObjectId, data: PurchaseTipGridItemDto): Promise<any> {
    const { tipMenuItemId, performerId, conversationId, idempotencyKey, executionMode = 'IMMEDIATE' } = data;

    // Validate tip menu item
    const tipMenuItem = await this.getTipMenuItemById(tipMenuItemId);
    if (!tipMenuItem.isActive) {
      throw new BadRequestException('Tip menu item is not active');
    }

    // Validate performer
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new NotFoundException('Performer not found');
    }

    // Validate performer matches tip menu item
    if (tipMenuItem.performerId.toString() !== performerId.toString()) {
      throw new BadRequestException('Tip menu item does not belong to this performer');
    }

    // Handle based on execution mode
    if (executionMode === 'IMMEDIATE') {
      return this.purchaseTipGridItemImmediate(userId, tipMenuItem, performerId, conversationId, idempotencyKey, performer);
    } else if (executionMode === 'QUEUED') {
      return this.purchaseTipGridItemQueued(userId, tipMenuItem, performerId, conversationId, idempotencyKey, performer);
    } else {
      throw new BadRequestException('Invalid execution mode');
    }
  }

  // IMMEDIATE mode - existing Phase 2 behavior
  private async purchaseTipGridItemImmediate(
    userId: string | ObjectId,
    tipMenuItem: any, // TipMenuItem with _id from Mongoose
    performerId: string | ObjectId,
    conversationId: string | undefined,
    idempotencyKey: string | undefined,
    performer: any
  ): Promise<any> {
    // Create PurchasedItem with idempotencyKey if provided
    const purchasedItemData: any = {
      source: ROLE.USER,
      sourceId: userId,
      target: PURCHASE_ITEM_TARGET_TYPE.TIP_GRID_ITEM,
      targetId: conversationId || performer._id,
      sellerId: performerId,
      type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
      name: tipMenuItem.label,
      description: tipMenuItem.description,
      price: tipMenuItem.price,
      quantity: 1,
      totalPrice: tipMenuItem.price,
      originalPrice: tipMenuItem.price,
      status: PURCHASE_ITEM_STATUS.SUCCESS,
      extraInfo: {
        tipMenuItemId: tipMenuItem._id,
        conversationId: conversationId || null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add idempotency key if provided
    if (idempotencyKey) {
      purchasedItemData.idempotencyKey = idempotencyKey;
    }

    try {
      const purchasedItem = await this.PurchasedItemModel.create(purchasedItemData);

      // Publish event to trigger settlement
      await this.queueEventService.publish(
        new QueueEvent({
          channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: purchasedItem
        })
      );

      return {
        success: true,
        transactionId: purchasedItem._id,
        message: 'Tip grid item purchased successfully'
      };
    } catch (error) {
      // Handle duplicate idempotency key
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        throw new BadRequestException('Duplicate request detected. Transaction already processed.');
      }
      throw error;
    }
  }

  // QUEUED mode - new Phase 7 behavior
  private async purchaseTipGridItemQueued(
    userId: string | ObjectId,
    tipMenuItem: any, // TipMenuItem with _id from Mongoose
    performerId: string | ObjectId,
    conversationId: string | undefined,
    idempotencyKey: string | undefined,
    performer: any
  ): Promise<any> {
    // Create PurchasedItem with status PENDING
    const purchasedItemData: any = {
      source: ROLE.USER,
      sourceId: userId,
      target: PURCHASE_ITEM_TARGET_TYPE.TIP_GRID_ITEM,
      targetId: conversationId || performer._id,
      sellerId: performerId,
      type: PURCHASE_ITEM_TYPE.TIP_GRID_ITEM,
      name: tipMenuItem.label,
      description: tipMenuItem.description,
      price: tipMenuItem.price,
      quantity: 1,
      totalPrice: tipMenuItem.price,
      originalPrice: tipMenuItem.price,
      status: PURCHASE_ITEM_STATUS.PENDING,
      extraInfo: {
        tipMenuItemId: tipMenuItem._id,
        tipMenuId: tipMenuItem.tipMenuId,
        conversationId: conversationId || null,
        executionMode: 'QUEUED'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add idempotency key if provided
    if (idempotencyKey) {
      purchasedItemData.idempotencyKey = idempotencyKey;
    }

    try {
      const purchasedItem = await this.PurchasedItemModel.create(purchasedItemData);

      // Enqueue job to PerformanceQueue - DO NOT publish to PURCHASED_ITEM_SUCCESS_CHANNEL yet
      const queuePayload = {
        idempotencyKey: idempotencyKey || purchasedItem._id.toString(),
        purchasedItemId: purchasedItem._id.toString(),
        performerId: performerId.toString(),
        userId: userId.toString(),
        tipMenuId: tipMenuItem.tipMenuId.toString(),
        tipGridItemId: tipMenuItem._id.toString()
      };

      const queueResponse = await this.performanceQueueService.submitRequest(
        userId as any,
        {
          type: 'tip_grid_item_queued',
          mode: 'fifo',
          payload: queuePayload,
          priority: 5,
          idempotencyKey: idempotencyKey || purchasedItem._id.toString()
        }
      );

      return {
        success: true,
        queueRequestId: queueResponse.requestId,
        purchasedItemId: purchasedItem._id,
        message: 'Tip grid item queued for processing',
        queuePosition: queueResponse.queuePosition
      };
    } catch (error) {
      // Handle duplicate idempotency key
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        throw new BadRequestException('Duplicate request detected. Transaction already processed.');
      }
      throw error;
    }
  }

  // Processor for queued tip grid items - called when job is completed
  private async processTipGridItemQueued(payload: any): Promise<any> {
    const { purchasedItemId } = payload;

    // Reload the PurchasedItem
    const purchasedItem = await this.PurchasedItemModel.findById(purchasedItemId);

    if (!purchasedItem) {
      throw new Error(`PurchasedItem not found: ${purchasedItemId}`);
    }

    // Check if already processed
    if (purchasedItem.status !== PURCHASE_ITEM_STATUS.PENDING) {
      return {
        success: true,
        message: 'Already processed',
        purchasedItemId
      };
    }

    // Update status to SUCCESS
    await this.PurchasedItemModel.updateOne(
      { _id: purchasedItemId },
      { 
        $set: { 
          status: PURCHASE_ITEM_STATUS.SUCCESS,
          updatedAt: new Date()
        } 
      }
    );

    // Reload to get updated item
    const updatedItem = await this.PurchasedItemModel.findById(purchasedItemId);

    // NOW publish to PURCHASED_ITEM_SUCCESS_CHANNEL to trigger settlement
    await this.queueEventService.publish(
      new QueueEvent({
        channel: PURCHASED_ITEM_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: updatedItem
      })
    );

    return {
      success: true,
      message: 'Tip grid item processed and published for settlement',
      purchasedItemId
    };
  }
}
