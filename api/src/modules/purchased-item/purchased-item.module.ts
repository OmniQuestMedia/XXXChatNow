import { Module, forwardRef } from '@nestjs/common';
import { StudioModule } from 'src/modules/studio/studio.module';
import { MessageModule } from 'src/modules/message/message.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PerformerModule } from '../performer/performer.module';
import { PerformerAssetsModule } from '../performer-assets/performer-assets.module';
import { SettingModule } from '../settings/setting.module';
import { LoyaltyPointsModule } from '../loyalty-points/loyalty-points.module';
import { PerformanceQueueModule } from '../performance-queue/performance-queue.module';
import {
  PurchaseItemService,
  PurchasedItemSearchService,
  PaymentTokenService
} from './services';
import {
  PaymentTokenController,
  PaymentTokenSearchController,
  MemberPaymentToken
} from './controllers';
import { TokenPackageModule } from '../token-package/token-package.module';
import { PaymentTokenListener, PostTipRRREarnAndEmitListener } from './listeners';
import { SocketModule } from '../socket/socket.module';
import {
  PurchasedItem,
  PurchasedItemSchema,
  TipActivatedEventLog,
  TipActivatedEventLogSchema
} from './schemas';
import { CrowdfundingModule } from '../crowdfunding/crowdfunding.module';
import { PaymentModule } from '../payment/payment.module';
import { AcceptSpinWheelListener } from './listeners/accept-spin-wheel-request.listener';
import { StatisticModule } from '../statistic/statistic.module';
import { StreamModule } from '../stream/stream.module';
import { PerformerScheduleModule } from '../performer-schedule/performer-schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PurchasedItem.name,
        schema: PurchasedItemSchema
      },
      {
        name: TipActivatedEventLog.name,
        schema: TipActivatedEventLogSchema
      }
    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => PerformerModule),
    forwardRef(() => SettingModule),
    forwardRef(() => PerformerAssetsModule),
    forwardRef(() => TokenPackageModule),
    forwardRef(() => SocketModule),
    forwardRef(() => StudioModule),
    forwardRef(() => MessageModule),
    forwardRef(() => CrowdfundingModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => StatisticModule),
    forwardRef(() => StreamModule),
    forwardRef(() => PerformerScheduleModule),
    forwardRef(() => LoyaltyPointsModule),
    forwardRef(() => PerformanceQueueModule)
  ],
  providers: [
    PurchaseItemService,
    PurchasedItemSearchService,
    PaymentTokenListener,
    PaymentTokenService,
    // OrderService,
    AcceptSpinWheelListener,
    PostTipRRREarnAndEmitListener
  ],
  controllers: [
    PaymentTokenController,
    PaymentTokenSearchController,
    MemberPaymentToken
  ],
  exports: [
    PurchaseItemService,
    PurchasedItemSearchService,
    PaymentTokenService
  ]
})
export class PurchasedItemModule { }
