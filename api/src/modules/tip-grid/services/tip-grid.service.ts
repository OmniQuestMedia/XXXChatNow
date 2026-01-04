import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class TipGridService {
  constructor(
    @InjectModel(TipMenu.name) private readonly TipMenuModel: Model<TipMenu>,
    @InjectModel(TipMenuItem.name) private readonly TipMenuItemModel: Model<TipMenuItem>,
    @InjectModel(PurchasedItem.name) private readonly PurchasedItemModel: Model<PurchasedItem>,
    private readonly queueEventService: QueueEventService,
    private readonly performerService: PerformerService
  ) {}

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
    const { tipMenuItemId, performerId, conversationId, idempotencyKey } = data;

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

    // Create PurchasedItem with idempotencyKey if provided
    const purchasedItemData: any = {
      source: ROLE.USER,
      sourceId: userId,
      target: PURCHASE_ITEM_TARGET_TYPE.TIP,
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
        tipMenuItemId: (tipMenuItem as any)._id,
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
}
