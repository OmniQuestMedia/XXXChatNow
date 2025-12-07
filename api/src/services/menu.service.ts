import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import MenuSchema, { IMenu } from '../models/menu';
import { CreateMenuDto, UpdateMenuDto, SetDiscountModifiersDto, SetBumpModifiersDto, PublishMenuDto } from '../dto/menu.dto';
@Injectable()
export class MenuService {
  constructor(
    @InjectModel('Menu') private readonly menuModel: Model<IMenu>
  ) {}
  async createMenu(modelId: string, dto: CreateMenuDto) {
    const count = await this.menuModel.countDocuments({ modelId });
    if (count >= 8) throw new BadRequestException('Models can only have up to 8 menus');
    const created = new this.menuModel({ ...dto, modelId });
    return created.save();
  }
  async getMenusByModel(modelId: string) {
    return this.menuModel.find({ modelId });
  }
  async getMenu(id: string, user: any) {
    // Add logic: if models can view their own, if not admin, etc.
    const menu = await this.menuModel.findById(id);
    if (!menu) throw new NotFoundException('Menu not found');
    // Add further access logic as required
    return menu;
  }
  async updateMenu(id: string, modelId: string, dto: UpdateMenuDto) {
    const menu = await this.menuModel.findOne({ _id: id, modelId });
    if (!menu) throw new NotFoundException('Menu not found');
    // Add granular field updates as per security/business needs
    Object.assign(menu, dto);
    await menu.save();
    return menu;
  }
  async deleteMenu(id: string, modelId: string) {
    const deleted = await this.menuModel.findOneAndDelete({ _id: id, modelId });
    if (!deleted) throw new NotFoundException('Menu not found or permission denied');
    return { success: true };
  }
  async setDiscountModifiers(id: string, modelId: string, dto: SetDiscountModifiersDto) {
    const menu = await this.menuModel.findOne({ _id: id, modelId });
    if (!menu) throw new NotFoundException('Menu not found');
    if (menu.bumpModifiers?.enabled) throw new BadRequestException('Cannot enable flash discount while a menu bump is active');
    menu.discountModifiers = { ...dto, enabled: true };
    await menu.save();
    return menu;
  }
  async setBumpModifiers(id: string, modelId: string, dto: SetBumpModifiersDto) {
    const menu = await this.menuModel.findOne({ _id: id, modelId });
    if (!menu) throw new NotFoundException('Menu not found');
    if (menu.discountModifiers?.enabled) throw new BadRequestException('Cannot enable bump while a flash discount is active');
    menu.bumpModifiers = { ...dto, enabled: true };
    await menu.save();
    return menu;
  }
  async publishMenu(id: string, modelId: string, dto: PublishMenuDto) {
    const menu = await this.menuModel.findOne({ _id: id, modelId });
    if (!menu) throw new NotFoundException('Menu not found');
    menu.isActive = !!dto.active;
    await menu.save();
    // TODO: Emit socket event to users as needed
    // Example: this.socketService.emitMenuUpdate(menu);
    return { success: true, menu };
  }
  async getMenusWithPromotions() {
    // Query any menu where flash discount or bump is enabled AND active (plus check time)
    const now = new Date();
    return this.menuModel.find({
      $or: [
        { 'discountModifiers.enabled': true, 'discountModifiers.endTime': { $gt: now } },
        { 'bumpModifiers.enabled': true, $or: [ { 'bumpModifiers.endTime': { $gt: now } }, { 'bumpModifiers.manualOff': true } ] }
      ]
    });
  }
}
