import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { PerformerModule } from '../performer/performer.module';
import { PurchasedItemModule } from '../purchased-item/purchased-item.module';
import { SettingModule } from '../settings/setting.module';
import { AdminEarningController, StudioEarningController, PerformerEarningController } from './controllers';
import { EarningService } from './services/earning.service';
import { TransactionEarningListener } from './listeners/earning.listener';
import { StudioModule } from '../studio/studio.module';
import { Earning, EarningSchema } from './schemas/earning.schema';
import { ReferralModule } from '../referral/referral.module';
import { ReferralEarningService } from './services/referral-earning.service';
import { ReferralEarningController } from './controllers/referral-earning.controller';
import { ReferralEarningListener } from './listeners/referral-model-earning';
import { ReferralEarning, ReferralEarningSchema } from './schemas/referral-earning.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Earning.name,
        schema: EarningSchema
      },
      {
        name: ReferralEarning.name,
        schema: ReferralEarningSchema
      }
    ]),
    StudioModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => UserModule),
    forwardRef(() => PurchasedItemModule),
    forwardRef(() => SettingModule),
    forwardRef(() => ReferralModule)
  ],
  providers: [EarningService, TransactionEarningListener, ReferralEarningService, ReferralEarningListener],
  controllers: [
    StudioEarningController,
    AdminEarningController,
    PerformerEarningController,
    ReferralEarningController
  ],
  exports: [EarningService, TransactionEarningListener, ReferralEarningListener]
})
export class EarningModule { }
