import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TipMenu, TipMenuSchema, TipMenuItem, TipMenuItemSchema } from './schemas';
import { TipGridService } from './services';
import { TipGridController } from './controllers';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';
import { PurchasedItem, PurchasedItemSchema } from '../purchased-item/schemas/purchase-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TipMenu.name,
        schema: TipMenuSchema
      },
      {
        name: TipMenuItem.name,
        schema: TipMenuItemSchema
      },
      {
        name: PurchasedItem.name,
        schema: PurchasedItemSchema
      }
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PurchasedItemModule)
  ],
  providers: [TipGridService],
  controllers: [TipGridController],
  exports: [TipGridService]
})
export class TipGridModule {}
