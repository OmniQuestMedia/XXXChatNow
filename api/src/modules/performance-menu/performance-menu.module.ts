/**
 * Performance Menu Module
 * 
 * Provides menu management and purchasing functionality.
 * Implements MODEL_PERFORMANCE_MENU.md specifications.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Menu, MenuSchema } from './schemas/menu.schema';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { MenuPurchase, MenuPurchaseSchema } from './schemas/menu-purchase.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { PerformanceMenuService } from './services';
import { PerformanceMenuController } from './controllers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Menu.name, schema: MenuSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: MenuPurchase.name, schema: MenuPurchaseSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [PerformanceMenuController],
  providers: [PerformanceMenuService],
  exports: [PerformanceMenuService]
})
export class PerformanceMenuModule {}
