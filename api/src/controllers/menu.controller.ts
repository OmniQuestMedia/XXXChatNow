import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { MenuService } from '../services/menu.service';
import { CreateMenuDto, UpdateMenuDto, SetDiscountModifiersDto, SetBumpModifiersDto, PublishMenuDto } from '../dto/menu.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ModelRoleGuard, AdminRoleGuard } from '../common/guards/role.guard';
@Controller('menus')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
  @Post()
  @UseGuards(ModelRoleGuard)
  async createMenu(@Req() req, @Body() dto: CreateMenuDto) {
    const modelId = req.user.id;
    return this.menuService.createMenu(modelId, dto);
  }
  @Get()
  async getMenus(@Req() req, @Query('modelId') modelId?: string) {
    const callerIsAdmin = req.user.role === 'admin';
    if (callerIsAdmin && modelId) {
      return this.menuService.getMenusByModel(modelId);
    }
    return this.menuService.getMenusByModel(req.user.id);
  }
  @Get(':id')
  async getMenu(@Param('id') id: string, @Req() req) {
    return this.menuService.getMenu(id, req.user);
  }
  @Put(':id')
  @UseGuards(ModelRoleGuard)
  async updateMenu(@Param('id') id: string, @Body() dto: UpdateMenuDto, @Req() req) {
    return this.menuService.updateMenu(id, req.user.id, dto);
  }
  @Delete(':id')
  @UseGuards(ModelRoleGuard)
  async deleteMenu(@Param('id') id: string, @Req() req) {
    return this.menuService.deleteMenu(id, req.user.id);
  }
  @Post(':id/discount-modifiers')
  @UseGuards(ModelRoleGuard)
  async setDiscountModifiers(
    @Param('id') id: string,
    @Body() dto: SetDiscountModifiersDto,
    @Req() req
  ) {
    return this.menuService.setDiscountModifiers(id, req.user.id, dto);
  }
  @Post(':id/bump-modifiers')
  @UseGuards(ModelRoleGuard)
  async setBumpModifiers(
    @Param('id') id: string,
    @Body() dto: SetBumpModifiersDto,
    @Req() req
  ) {
    return this.menuService.setBumpModifiers(id, req.user.id, dto);
  }
  @Post(':id/publish')
  @UseGuards(ModelRoleGuard)
  async publishMenu(@Param('id') id: string, @Body() dto: PublishMenuDto, @Req() req) {
    return this.menuService.publishMenu(id, req.user.id, dto);
  }
  @Get('/promotions/all')
  @UseGuards(AdminRoleGuard)
  async getMenusWithPromotions() {
    return this.menuService.getMenusWithPromotions();
  }
}
