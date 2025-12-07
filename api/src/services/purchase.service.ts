import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IMenu } from '../models/menu';
import { IChip } from '../models/chip';
// import token, user/model wallet, socket/io, etc. as needed

@Injectable()
export class PurchaseService {
  constructor(
    @InjectModel('Menu') private readonly menuModel: Model<IMenu>
    // Inject user/token/model services as required for accounting and notifications
  ) {}

  // Main purchase logic
  async purchaseChip(userId: string, menuId: string, chipId: string) {
    // 1. Load menu and active price modifiers
    const menu = await this.menuModel.findById(menuId);
    if (!menu || !menu.isActive) throw new NotFoundException('Menu not found or inactive');

    // 2. Find chip, confirm enabled
    const chip = menu.chips.id(chipId) as IChip;
    if (!chip || !chip.enabled) throw new NotFoundException('Chip not found/enabled');

    // 3. Calculate price based on active modifiers
    const price = this.calculateChipPrice(menu, chip.price);

    // 4. Deduct tokens from user and credit model (implement atomic token logic)
    // 4a. Example: await this.tokenService.purchase(userId, menu.modelId, price);

    // 5. Gratitude logic: select, personalize, and record next comment
    const gratitudeText = this.getNextGratitude(menu, { username: await this.getUserDisplayName(userId) });

    // 6. Handle goal progress / milestones if active
    const goalEvents = this.checkGoalProgressAndTrigger(menu, price);

    // 7. Emit Socket.IO events (menu updates, gratitude, goal, chip, notifications)
    // await this.socketService.emitChipPurchase({ ... });

    // 8. Save state if needed
    // ...

    return {
      pricePaid: price,
      gratitude: gratitudeText,
      chip,
      goalEvents,
    };
  }

  // --- Utilities ---

  calculateChipPrice(menu: IMenu, basePrice: number): number {
    if (menu.discountModifiers?.enabled) {
      const now = Date.now();
      if (menu.discountModifiers.startTime && menu.discountModifiers.endTime) {
        if (now >= new Date(menu.discountModifiers.startTime).getTime() && now <= new Date(menu.discountModifiers.endTime).getTime()) {
          return Math.ceil(basePrice * (1 - menu.discountModifiers.percent / 100));
        }
      }
    }
    if (menu.bumpModifiers?.enabled) {
      if (
        menu.bumpModifiers.manualOff ||
        (menu.bumpModifiers.startTime && menu.bumpModifiers.endTime &&
        Date.now() >= new Date(menu.bumpModifiers.startTime).getTime() &&
        Date.now() <= new Date(menu.bumpModifiers.endTime).getTime())
      ) {
        return Math.ceil(basePrice * (1 + menu.bumpModifiers.percent / 100));
      }
    }
    return basePrice;
  }

  getNextGratitude(menu: IMenu, context: { username: string }): string | null {
    if (!menu.gratitudeComments.length) return null;
    const buffer = menu.gratitudeRotationBuffer || [];
    const available = menu.gratitudeComments
      .map((c, i) => i)
      .filter(i => !buffer.includes(i));
    const idx = available.length
      ? available[Math.floor(Math.random() * available.length)]
      : (buffer[0] + 1) % menu.gratitudeComments.length; // fallback, always cycles

    // Rotate buffer: ensure at least two others cycle before repeat
    if (!buffer.includes(idx)) {
      buffer.push(idx);
      if (buffer.length > 2) buffer.shift();
      menu.gratitudeRotationBuffer = buffer;
      menu.save(); // Save new buffer
    }

    let text = menu.gratitudeComments[idx].text;
    return text.replace(/\{username\}/g, context.username);
  }

  async getUserDisplayName(userId: string): Promise<string> {
    // Load and return display name/username
    // ...
    return 'User123'; // stub
  }

  checkGoalProgressAndTrigger(menu: IMenu, amount: number): any[] {
    // Increase menu's goal progress (if enabled); check for milestone triggers (GIF/WAV logic)
    // Can emit via Socket.IO or return list of triggered milestones for the controller to handle
    return [];
  }
}
