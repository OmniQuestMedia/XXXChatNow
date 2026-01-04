import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'src/modules/auth/guards';
import { CurrentUser, Roles } from 'src/modules/auth/decorators';
import { UserDto } from 'src/modules/user/dtos';
import { TipGridService } from '../services';
import {
  CreateTipMenuDto,
  UpdateTipMenuDto,
  CreateTipMenuItemDto,
  UpdateTipMenuItemDto,
  PurchaseTipGridItemDto
} from '../dtos';

@Controller('tip-grid')
export class TipGridController {
  constructor(private readonly tipGridService: TipGridService) {}

  // Performer endpoints - manage their own tip menu
  @Post('menu')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async createMyTipMenu(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: CreateTipMenuDto
  ) {
    const tipMenu = await this.tipGridService.createTipMenu(currentUser._id, payload);
    return {
      data: tipMenu,
      success: true
    };
  }

  @Get('menu/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async getMyTipMenu(@CurrentUser() currentUser: UserDto) {
    const tipMenu = await this.tipGridService.getTipMenuByPerformerId(currentUser._id);
    return {
      data: tipMenu,
      success: true
    };
  }

  @Put('menu')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async updateMyTipMenu(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: UpdateTipMenuDto
  ) {
    const tipMenu = await this.tipGridService.updateTipMenu(currentUser._id, payload);
    return {
      data: tipMenu,
      success: true
    };
  }

  @Delete('menu')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async deleteMyTipMenu(@CurrentUser() currentUser: UserDto) {
    await this.tipGridService.deleteTipMenu(currentUser._id);
    return {
      success: true,
      message: 'Tip menu deleted successfully'
    };
  }

  // TipMenuItem endpoints
  @Post('items')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async createTipMenuItem(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: CreateTipMenuItemDto
  ) {
    const item = await this.tipGridService.createTipMenuItem(currentUser._id, payload);
    return {
      data: item,
      success: true
    };
  }

  @Get('items/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async getMyTipMenuItems(@CurrentUser() currentUser: UserDto) {
    const items = await this.tipGridService.getTipMenuItems(currentUser._id);
    return {
      data: items,
      success: true
    };
  }

  @Put('items/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async updateTipMenuItem(
    @Param('id') id: string,
    @Body() payload: UpdateTipMenuItemDto
  ) {
    const item = await this.tipGridService.updateTipMenuItem(id, payload);
    return {
      data: item,
      success: true
    };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('performer')
  async deleteTipMenuItem(@Param('id') id: string) {
    await this.tipGridService.deleteTipMenuItem(id);
    return {
      success: true,
      message: 'Tip menu item deleted successfully'
    };
  }

  // Public endpoints - view performer tip menu
  @Get('menu/performer/:performerId')
  @HttpCode(HttpStatus.OK)
  async getPerformerTipMenu(@Param('performerId') performerId: string) {
    const tipMenu = await this.tipGridService.getTipMenuByPerformerId(performerId);
    return {
      data: tipMenu,
      success: true
    };
  }

  @Get('items/performer/:performerId')
  @HttpCode(HttpStatus.OK)
  async getPerformerTipMenuItems(@Param('performerId') performerId: string) {
    const items = await this.tipGridService.getTipMenuItems(performerId);
    return {
      data: items,
      success: true
    };
  }

  // Purchase endpoint - users can purchase tip grid items
  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('user')
  async purchaseTipGridItem(
    @CurrentUser() currentUser: UserDto,
    @Body() payload: PurchaseTipGridItemDto
  ) {
    const result = await this.tipGridService.purchaseTipGridItem(currentUser._id, payload);
    return result;
  }
}
