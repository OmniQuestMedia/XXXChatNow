import { Module } from '@nestjs/common';
import { ConfigModule } from 'nestjs-config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './modules/socket/socket.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SettingModule } from './modules/settings/setting.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { PostModule } from './modules/post/post.module';
import { FileModule } from './modules/file/file.module';
import { PerformerModule } from './modules/performer/performer.module';
import { UtilsModule } from './modules/utils/utils.module';
import { PerformerAssetsModule } from './modules/performer-assets/performer-assets.module';
import { StreamModule } from './modules/stream/stream.module';
import { TokenPackageModule } from './modules/token-package/token-package.module';
import { FavouriteModule } from './modules/favourite/favourite.module';
import { PaymentModule } from './modules/payment/payment.module';
import { MessageModule } from './modules/message/message.module';
import { PurchasedItemModule } from './modules/purchased-item/purchased-item.module';
import { EarningModule } from './modules/earning/earning.module';
import { RefundRequestModule } from './modules/refund-request/refund.module';
import { PayoutRequestModule } from './modules/payout-request/payout.module';
import { BannerModule } from './modules/banner/banner.module';
import { PaymentInformationModule } from './modules/payment-information/payment-information.module';
import { StatisticModule } from './modules/statistic/statistic.module';
import { StudioModule } from './modules/studio/studio.module';
import { CamAggregatorModule } from './modules/cam-aggregator/cam-aggregator.module';
import { ContactModule } from './modules/contact/contact.module';
import {
  AgendaModule, QueueModule
} from './kernel';
import { DBLoggerModule } from './modules/logger';
import { DBLoggerModule2 } from './modules/logger/db-logger.module2';
import { CrowdfundingModule } from './modules/crowdfunding/crowdfunding.module';
import { FeaturedCreatorModule } from './modules/featured-creator/featured-creator.module';
import { LeaderBoardModule } from './modules/leader-board/leader-board.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReferralModule } from './modules/referral/referral.module';
import { WheelModule } from './modules/wheel/wheel.module';
import { PerformerScheduleModule } from './modules/performer-schedule/performer-schedule.module';
import { SlotMachineModule } from './modules/slot-machine/slot-machine.module';
import { LoyaltyPointsModule } from './modules/loyalty-points/loyalty-points.module';
import { PerformanceQueueModule } from './modules/performance-queue/performance-queue.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { MoodMessagingModule } from './modules/mood-messaging/mood-messaging.module';
import { PerformanceMenuModule } from './modules/performance-menu/performance-menu.module';
import { MoodMessageModule } from './modules/mood-message/mood-message.module';

@Module({
  imports: [
    ConfigModule.resolveRootPath(__dirname).load('config/**/!(*.d).{ts,js}'),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public')
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    QueueModule.forRoot(),
    AgendaModule.register(),
    DBLoggerModule,
    DBLoggerModule2, // this is a separate module to show db log to admin panel
    UtilsModule,
    AuthModule,
    SocketModule,
    SettingModule,
    UserModule,
    PostModule,
    MailerModule,
    FileModule,
    PerformerModule,
    PerformerAssetsModule,
    StreamModule,
    TokenPackageModule,
    FavouriteModule,
    PaymentModule,
    MessageModule,
    PurchasedItemModule,
    EarningModule,
    RefundRequestModule,
    PayoutRequestModule,
    BannerModule,
    PaymentInformationModule,
    StatisticModule,
    StudioModule,
    CamAggregatorModule,
    ContactModule,
    CrowdfundingModule,
    ReferralModule,
    WheelModule,
    NotificationModule,
    LeaderBoardModule,
    FeaturedCreatorModule,
    PerformerScheduleModule,
    SlotMachineModule,
    LoyaltyPointsModule,
    PerformanceQueueModule,
    WalletModule,
    MoodMessagingModule,
    PerformanceMenuModule,
    MoodMessageModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
