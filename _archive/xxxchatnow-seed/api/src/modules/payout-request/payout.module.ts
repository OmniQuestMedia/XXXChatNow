import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PayoutRequestService, StudioPayoutRequestService } from './services';
import {
  PayoutRequestController,
  StudioPayoutRequestController,
  AdminPayoutRequestController,
  PayoutRequestSearchController
} from './controllers';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { SettingModule } from '../settings/setting.module';
import { EarningModule } from '../earning/earning.module';
import { UpdatePayoutRequestListener } from './listeners';
import { StudioModule } from '../studio/studio.module';
import { PaymentInformationModule } from '../payment-information/payment-information.module';
import { PayoutRequest, PayoutRequestSchema } from './schemas/payout-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PayoutRequest.name,
        schema: PayoutRequestSchema
      }
    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    UserModule,
    StudioModule,
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => SettingModule),
    forwardRef(() => EarningModule),
    forwardRef(() => PaymentInformationModule),
    forwardRef(() => UserModule)
  ],
  providers: [
    PayoutRequestService,
    StudioPayoutRequestService,
    UpdatePayoutRequestListener
  ],
  controllers: [
    PayoutRequestController,
    StudioPayoutRequestController,
    AdminPayoutRequestController,
    PayoutRequestSearchController
  ],
  exports: [PayoutRequestService, StudioPayoutRequestService]
})
export class PayoutRequestModule { }
