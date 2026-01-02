/**
 * Performance Menu Controller
 * 
 * REST API endpoints for menu management and purchases.
 * All endpoints require authentication.
 * 
 * Reference: MODEL_PERFORMANCE_MENU.md
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PerformanceMenuService } from '../services';
import { PurchaseMenuItemDto } from '../dtos';

/**
 * Controller for performance menu operations
 */
@ApiTags('Performance Menu')
@Controller('menu')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PerformanceMenuController {
  constructor(
    private readonly menuService: PerformanceMenuService
  ) {}

  /**
   * Get menu by ID
   */
  @Get(':menuId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get menu details' })
  @ApiResponse({ status: 200, description: 'Menu details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async getMenu(
    @Param('menuId') menuId: string,
    @CurrentUser() user: any
  ) {
    return this.menuService.getMenu(menuId, user._id);
  }

  /**
   * Get menus for a model
   */
  @Get('model/:modelId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all active menus for a model' })
  @ApiResponse({ status: 200, description: 'Menus retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getModelMenus(
    @Param('modelId') modelId: string,
    @CurrentUser() user: any
  ) {
    return this.menuService.getMenuByModelId(modelId, user._id);
  }

  /**
   * Purchase a menu item
   */
  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase a menu item' })
  @ApiResponse({ status: 200, description: 'Purchase completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (insufficient balance, invalid item, etc.)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Menu or item not found' })
  async purchaseMenuItem(
    @Body() dto: PurchaseMenuItemDto,
    @CurrentUser() user: any
  ) {
    return this.menuService.purchaseMenuItem(user._id, dto);
  }

  /**
   * Get purchase history
   */
  @Get('purchase/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user purchase history' })
  @ApiResponse({ status: 200, description: 'Purchase history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPurchaseHistory(
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
    @CurrentUser() user: any
  ) {
    return this.menuService.getPurchaseHistory(
      user._id,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );
  }

  /**
   * Get purchase status
   */
  @Get('purchase/:purchaseId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get purchase status' })
  @ApiResponse({ status: 200, description: 'Purchase status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Purchase not found' })
  async getPurchaseStatus(
    @Param('purchaseId') purchaseId: string,
    @CurrentUser() user: any
  ) {
    return this.menuService.getPurchaseStatus(purchaseId, user._id);
  }
}
