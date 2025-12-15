import { Module, forwardRef } from '@nestjs/common';
import { RefundRequestUpdateListener } from 'src/modules/refund-request/listeners';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RefundRequestService } from './services/refund-request.service';
import { RefundRequestController } from './controllers/refund-request.controller';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { SettingModule } from '../settings/setting.module';
import { PaymentModule } from '../payment/payment.module';
import { RefundRequest, RefundRequestSchema } from './schemas/refund-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RefundRequest.name,
        schema: RefundRequestSchema
      }
    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    UserModule,
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PaymentModule)
  ],
  providers: [
    RefundRequestUpdateListener,
    RefundRequestService
  ],
  controllers: [RefundRequestController],
  exports: [RefundRequestService]
})
export class RefundRequestModule { }
