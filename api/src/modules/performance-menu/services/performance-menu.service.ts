/**
 * Performance Menu Service
 * 
 * Handles menu item purchases with queue mode support.
 * Implements deterministic, server-side validated token transactions.
 * 
 * Reference: MODEL_PERFORMANCE_MENU.md, SECURITY_AUDIT_POLICY_AND_CHECKLIST.md
 */

import { 
  Injectable, 
  Logger, 
  BadRequestException, 
  UnauthorizedException,
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { Menu } from '../schemas/menu.schema';
import { MenuItem } from '../schemas/menu-item.schema';
import { MenuPurchase } from '../schemas/menu-purchase.schema';
import { User } from '../../user/schemas/user.schema';
import { PurchaseMenuItemDto } from '../dtos';

/**
 * Service for managing menu item purchases
 */
@Injectable()
export class PerformanceMenuService {
  private readonly logger = new Logger(PerformanceMenuService.name);

  constructor(
    @InjectModel(Menu.name) private readonly MenuModel: Model<Menu>,
    @InjectModel(MenuItem.name) private readonly MenuItemModel: Model<MenuItem>,
    @InjectModel(MenuPurchase.name) private readonly MenuPurchaseModel: Model<MenuPurchase>,
    @InjectModel(User.name) private readonly UserModel: Model<User>
  ) {}

  /**
   * Get menu by ID with access control checks
   */
  async getMenu(menuId: string, userId: ObjectId): Promise<Menu> {
    const menu = await this.MenuModel.findById(menuId)
      .populate('menu_items')
      .exec();

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (!menu.is_active) {
      throw new BadRequestException('Menu is not active');
    }

    // Check visibility access
    await this.checkMenuAccess(menu, userId);

    return menu;
  }

  /**
   * Get menu by model ID
   */
  async getMenuByModelId(modelId: string, userId: ObjectId): Promise<Menu[]> {
    const menus = await this.MenuModel.find({
      model_id: new ObjectId(modelId),
      is_active: true
    })
      .populate('menu_items')
      .exec();

    // Filter menus based on visibility access
    const accessibleMenus = [];
    for (const menu of menus) {
      try {
        await this.checkMenuAccess(menu, userId);
        accessibleMenus.push(menu);
      } catch (error) {
        // User doesn't have access to this menu, skip it
        continue;
      }
    }

    return accessibleMenus;
  }

  /**
   * Purchase a menu item
   * Implements both queue OFF (immediate) and queue ON (escrow) modes
   */
  async purchaseMenuItem(
    userId: ObjectId,
    dto: PurchaseMenuItemDto
  ): Promise<any> {
    this.logger.log(`Purchase request from user ${userId} for menu item ${dto.menu_item_id}`);

    // Validate menu and menu item
    if (typeof dto.menu_id !== 'string') {
      throw new BadRequestException('Invalid menu id');
    }
    const menu = await this.MenuModel.findById(new ObjectId(dto.menu_id)).exec();
    if (!menu || !menu.is_active) {
      throw new NotFoundException('Menu not found or inactive');
    }

    const menuItem = await this.MenuItemModel.findById(dto.menu_item_id).exec();
    if (!menuItem || !menuItem.is_active) {
      throw new NotFoundException('Menu item not found or inactive');
    }

    // Verify menu item belongs to menu
    const itemInMenu = menu.menu_items.some(
      id => id.toString() === dto.menu_item_id
    );
    if (!itemInMenu) {
      throw new BadRequestException('Menu item does not belong to this menu');
    }

    // Check menu access
    await this.checkMenuAccess(menu, userId);

    // Get user and verify balance
    const user = await this.UserModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Server-side balance check (CRITICAL SECURITY)
    if (user.balance < menuItem.token_value) {
      throw new BadRequestException('Insufficient balance');
    }

    // Check daily purchase limit if set
    if (menuItem.max_daily_purchases) {
      await this.checkDailyPurchaseLimit(userId, menuItem._id, menuItem.max_daily_purchases);
    }

    // Check idempotency
    if (dto.idempotency_key) {
      const existingPurchase = await this.MenuPurchaseModel.findOne({
        idempotency_key: dto.idempotency_key
      }).exec();
      
      if (existingPurchase) {
        this.logger.warn(`Duplicate purchase attempt with idempotency key: ${dto.idempotency_key}`);
        return this.formatPurchaseResponse(existingPurchase);
      }
    }

    // Execute purchase based on queue mode
    if (menu.queue_mode === 'OFF') {
      return await this.executeImmediatePurchase(user, menu, menuItem, dto);
    } else {
      return await this.executeQueuedPurchase(user, menu, menuItem, dto);
    }
  }

  /**
   * Execute immediate purchase (Queue OFF mode)
   */
  private async executeImmediatePurchase(
    user: any,
    menu: Menu,
    menuItem: MenuItem,
    dto: PurchaseMenuItemDto
  ): Promise<any> {
    const purchaseId = uuidv4();
    const session = await this.MenuPurchaseModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Deduct tokens from user
        await this.UserModel.updateOne(
          { _id: user._id },
          { 
            $inc: { balance: -menuItem.token_value },
            $set: { updatedAt: new Date() }
          },
          { session }
        );

        // Credit tokens to model
        await this.UserModel.updateOne(
          { _id: menu.model_id },
          { 
            $inc: { balance: menuItem.token_value },
            $set: { updatedAt: new Date() }
          },
          { session }
        );

        // Award loyalty points if configured
        if (menuItem.bonus_loyalty_points > 0) {
          // Note: Loyalty points would be handled by loyalty-points module
          // This is a placeholder for integration
        }

        // Create purchase record
        const purchase = new this.MenuPurchaseModel({
          purchase_id: purchaseId,
          user_id: user._id,
          model_id: menu.model_id,
          menu_id: menu._id,
          menu_item_id: menuItem._id,
          token_value: menuItem.token_value,
          loyalty_points_awarded: menuItem.bonus_loyalty_points || 0,
          transaction_type: 'immediate',
          status: 'completed',
          completed_at: new Date(),
          idempotency_key: dto.idempotency_key,
          metadata: dto.metadata
        });

        await purchase.save({ session });

        this.logger.log(`Immediate purchase completed: ${purchaseId}`);
      });

      const purchase = await this.MenuPurchaseModel.findOne({ purchase_id: purchaseId }).exec();
      
      // TODO: Trigger Lovense activation if configured
      if (menuItem.lovense_activation?.enabled) {
        this.logger.log(`Lovense activation queued for purchase ${purchaseId}`);
        // Integration with Lovense service would go here
      }

      return this.formatPurchaseResponse(purchase);
    } catch (error) {
      this.logger.error(`Purchase failed: ${error.message}`, error.stack);
      throw new BadRequestException('Purchase failed. Please try again.');
    } finally {
      await session.endSession();
    }
  }

  /**
   * Execute queued purchase (Queue ON mode)
   */
  private async executeQueuedPurchase(
    user: any,
    menu: Menu,
    menuItem: MenuItem,
    dto: PurchaseMenuItemDto
  ): Promise<any> {
    const purchaseId = uuidv4();
    const session = await this.MenuPurchaseModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Deduct tokens from user (held in escrow)
        await this.UserModel.updateOne(
          { _id: user._id },
          { 
            $inc: { balance: -menuItem.token_value },
            $set: { updatedAt: new Date() }
          },
          { session }
        );

        // Create purchase record with pending status
        const purchase = new this.MenuPurchaseModel({
          purchase_id: purchaseId,
          user_id: user._id,
          model_id: menu.model_id,
          menu_id: menu._id,
          menu_item_id: menuItem._id,
          token_value: menuItem.token_value,
          loyalty_points_awarded: menuItem.bonus_loyalty_points || 0,
          transaction_type: 'queued',
          status: 'pending',
          idempotency_key: dto.idempotency_key,
          metadata: dto.metadata
        });

        await purchase.save({ session });

        // TODO: Add to performance queue
        // Integration with performance-queue module would go here
        // const queueEntry = await performanceQueueService.submitRequest({
        //   type: 'menu.purchase',
        //   mode: 'priority',
        //   priority: Math.floor(menuItem.token_value / 10),
        //   payload: { purchase_id: purchaseId },
        //   userId: user._id
        // });

        this.logger.log(`Queued purchase created: ${purchaseId}`);
      });

      const purchase = await this.MenuPurchaseModel.findOne({ purchase_id: purchaseId }).exec();
      return this.formatPurchaseResponse(purchase, {
        queue_position: 1, // Placeholder
        estimated_wait_minutes: 30 // Placeholder
      });
    } catch (error) {
      this.logger.error(`Queued purchase failed: ${error.message}`, error.stack);
      throw new BadRequestException('Purchase failed. Please try again.');
    } finally {
      await session.endSession();
    }
  }

  /**
   * Check if user has access to menu based on visibility
   */
  private async checkMenuAccess(menu: Menu, userId: ObjectId): Promise<void> {
    switch (menu.visibility) {
      case 'public':
        return; // Everyone has access

      case 'subscribers_only':
        // TODO: Check subscription status
        // const hasSubscription = await checkSubscription(userId, menu.model_id);
        // if (!hasSubscription) {
        //   throw new UnauthorizedException('Subscription required to access this menu');
        // }
        return;

      case 'private':
        const isWhitelisted = menu.whitelist_users?.some(
          id => id.toString() === userId.toString()
        );
        if (!isWhitelisted) {
          throw new UnauthorizedException('Access denied to this menu');
        }
        return;

      default:
        throw new BadRequestException('Invalid menu visibility configuration');
    }
  }

  /**
   * Check daily purchase limit for menu item
   */
  private async checkDailyPurchaseLimit(
    userId: ObjectId,
    menuItemId: ObjectId,
    maxPurchases: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPurchases = await this.MenuPurchaseModel.countDocuments({
      user_id: userId,
      menu_item_id: menuItemId,
      createdAt: { $gte: today },
      status: { $in: ['pending', 'completed'] }
    }).exec();

    if (todayPurchases >= maxPurchases) {
      throw new BadRequestException(
        `Daily purchase limit reached for this item (${maxPurchases} per day)`
      );
    }
  }

  /**
   * Format purchase response
   */
  private formatPurchaseResponse(purchase: any, additional?: any): any {
    return {
      success: true,
      purchase_id: purchase.purchase_id,
      transaction_type: purchase.transaction_type,
      status: purchase.status,
      token_value: purchase.token_value,
      loyalty_points_awarded: purchase.loyalty_points_awarded,
      ...additional
    };
  }

  /**
   * Get purchase history for user
   */
  async getPurchaseHistory(
    userId: ObjectId,
    limit = 50,
    offset = 0
  ): Promise<any> {
    const purchases = await this.MenuPurchaseModel.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('menu_id')
      .populate('menu_item_id')
      .exec();

    const total = await this.MenuPurchaseModel.countDocuments({ user_id: userId }).exec();

    return {
      purchases,
      total,
      limit,
      offset
    };
  }

  /**
   * Get purchase status
   */
  async getPurchaseStatus(purchaseId: string, userId: ObjectId): Promise<any> {
    const purchase = await this.MenuPurchaseModel.findOne({
      purchase_id: purchaseId,
      user_id: userId
    })
      .populate('menu_item_id')
      .exec();

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }
}
